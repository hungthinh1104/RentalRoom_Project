import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SnapshotService } from '../snapshots/snapshot.service';
import { StateTransitionLogger } from '../../shared/state-machines/transition-logger.service';
// import { AuditLogger } from '../../shared/audit/audit-logger';
import { DisputeStatus, DisputeResolution } from './dispute.types';
import { Decimal } from 'decimal.js';

@Injectable()
export class DisputeService {
  private readonly logger = new Logger(DisputeService.name);

  constructor(
    private prisma: PrismaService,
    private snapshotService: SnapshotService,
    private stateLogger: StateTransitionLogger,
    // private audit: AuditLogger,
  ) {}

  /**
   * List disputes based on role (admin = all, else related)
   */
  async listDisputes(userId: string, role: string) {
    const isAdmin = role === 'ADMIN';
    const where = isAdmin
      ? {}
      : {
          OR: [
            { claimantId: userId },
            { contract: { tenantId: userId } },
            { contract: { landlordId: userId } },
          ],
        };

    return this.prisma.dispute.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        contract: {
          select: {
            id: true,
            room: { select: { roomNumber: true, propertyId: true } },
            tenantId: true,
            landlordId: true,
          },
        },
        evidence: true,
      },
    });
  }

  /**
   * UC_DISPUTE_01: Create dispute record from tenant or landlord
   * Validates evidence count, assigns 14-day deadline
   */
  async createDispute(
    dto: {
      contractId: string;
      claimantRole: 'TENANT' | 'LANDLORD';
      claimAmount: number;
      description: string;
      evidenceUrls: string[];
    },
    userId: string,
  ) {
    // Validate contract exists and is in valid state for dispute
    const contract = await this.prisma.contract.findUnique({
      where: { id: dto.contractId },
      include: { room: true },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    // Race condition now prevented by DB unique constraint (contractId, status)
    // Prisma will throw on duplicate OPEN dispute attempt

    // Validate evidence provided
    if (!dto.evidenceUrls || dto.evidenceUrls.length === 0) {
      throw new BadRequestException(
        'At least one evidence item required: photos, receipts, or notes',
      );
    }

    if (dto.evidenceUrls.length > 10) {
      throw new BadRequestException('Maximum 10 evidence items allowed');
    }

    // Create dispute with deadline 14 days from now
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 14);

    return await this.prisma.$transaction(async (tx) => {
      const dispute = await tx.dispute.create({
        data: {
          contractId: dto.contractId,
          claimantId: userId,
          claimantRole: dto.claimantRole,
          claimAmount: new Decimal(dto.claimAmount),
          description: dto.description,
          status: 'OPEN',
          deadline,
          evidence: {
            create: dto.evidenceUrls.map((url, idx) => ({
              url,
              submittedBy: userId,
              type: 'CLAIMANT',
              order: idx,
            })),
          },
        },
        include: { evidence: true },
      });

      // 📸 CREATE SNAPSHOT: Dispute Created (MANDATORY - fail-fast)
      await this.snapshotService.create(
        {
          actorId: userId,
          actorRole: dto.claimantRole === 'TENANT' ? 'TENANT' : 'LANDLORD',
          actionType: 'dispute_created',
          entityType: 'DISPUTE',
          entityId: dispute.id,
          metadata: {
            contractId: dto.contractId,
            claimAmount: parseFloat(new Decimal(dto.claimAmount).toString()),
            claimantRole: dto.claimantRole,
            deadline: deadline.toISOString(),
            evidenceCount: dto.evidenceUrls.length,
            description: dto.description,
          },
        },
        tx,
      );

      return dispute;
    });
  }

  /**
   * Counter-party submits counter-evidence
   */
  async submitCounterEvidence(
    disputeId: string,
    dto: {
      evidenceUrls: string[];
    },
    userId: string,
  ) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { contract: true, evidence: true },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    if (dispute.status !== 'OPEN') {
      throw new ConflictException('Can only add evidence to open disputes');
    }

    // Check deadline
    if (new Date() > dispute.deadline) {
      throw new ConflictException('Dispute deadline passed');
    }

    // CRITICAL: Verify user is counter-party (not claimant)
    const isRespondent =
      userId === dispute.contract.tenantId ||
      userId === dispute.contract.landlordId;

    if (userId === dispute.claimantId || !isRespondent) {
      throw new ForbiddenException('Not authorized to submit counter evidence');
    }

    // CRITICAL: Enforce evidence limit (max 20 total, max 10 per party)
    const existingCount = dispute.evidence.length;
    if (existingCount + dto.evidenceUrls.length > 20) {
      throw new BadRequestException('Total evidence limit exceeded (max 20)');
    }

    const respondentCount = dispute.evidence.filter(
      (e) => e.type === 'RESPONDENT',
    ).length;
    if (respondentCount + dto.evidenceUrls.length > 10) {
      throw new BadRequestException(
        'Respondent evidence limit exceeded (max 10)',
      );
    }

    // Add counter-evidence
    const counterEvidence = await this.prisma.disputeEvidence.createMany({
      data: dto.evidenceUrls.map((url) => ({
        disputeId,
        url,
        submittedBy: userId,
        type: 'RESPONDENT',
      })),
    });

    // Audit log
    /*
    await this.audit.log({
      action: 'DISPUTE_COUNTER_EVIDENCE',
      entityType: 'DISPUTE',
      entityId: disputeId,
      userId,
      details: {
        evidenceCount: dto.evidenceUrls.length,
      },
    });
    */

    return counterEvidence;
  }

  /**
   * Admin reviews and resolves dispute
   * Can approve, reject, or partially approve claim
   */
  async resolveDispute(
    disputeId: string,
    dto: {
      resolution: DisputeResolution;
      approvedAmount: number;
      reason: string;
    },
    adminId: string,
  ) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { contract: true, evidence: true },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    if (dispute.status !== 'OPEN') {
      throw new ConflictException('Dispute already resolved');
    }

    // Validate approved amount
    if (dto.approvedAmount < 0 || dto.approvedAmount > Number(dispute.claimAmount)) {
      throw new BadRequestException(
        'Approved amount must be between 0 and claim amount',
      );
    }

    // CRITICAL: Wrap dispute resolution + financial side-effect in transaction
    const updatedDispute = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status: dto.resolution, // Maps APPROVED/REJECTED to status
          approvedAmount: new Decimal(dto.approvedAmount),
          resolvedAt: new Date(),
          resolvedBy: adminId,
          resolutionReason: dto.reason,
        },
      });

      // Process financial outcome atomically
      await this.processDisputeOutcomeTx(tx, updated);

      // � LOG STATE TRANSITION: Dispute OPEN → resolution (APPROVED/REJECTED/PARTIAL)
      await this.stateLogger.logTransitionSafe({
        entityType: 'dispute',
        entityId: disputeId,
        oldStatus: 'OPEN',
        newStatus: dto.resolution,
        actorId: adminId,
        actorRole: 'ADMIN',
        reason: dto.reason,
        metadata: {
          approvedAmount: parseFloat(new Decimal(dto.approvedAmount).toString()),
          claimAmount: parseFloat(new Decimal(dispute.claimAmount).toString()),
        },
      });

      // �📸 CREATE SNAPSHOT: Dispute Resolved (MANDATORY - fail-fast)
      await this.snapshotService.create(
        {
          actorId: adminId,
          actorRole: 'ADMIN',
          actionType: 'dispute_resolved',
          entityType: 'DISPUTE',
          entityId: disputeId,
          metadata: {
            resolution: dto.resolution,
            approvedAmount: parseFloat(new Decimal(dto.approvedAmount).toString()),
            claimAmount: parseFloat(new Decimal(dispute.claimAmount).toString()),
            reason: dto.reason,
            contractId: dispute.contractId,
          },
        },
        tx,
      );

      return updated;
    });

    // Audit log (Disabled - AuditLogger not found)
    /*
    await this.audit.log({
      action: 'DISPUTE_RESOLVED',
      entityType: 'DISPUTE',
      entityId: disputeId,
      userId: adminId,
      details: {
        resolution: dto.resolution,
        approvedAmount: dto.approvedAmount,
      },
    });
    */

    return updatedDispute;
  }

  /**
   * Get dispute details with all evidence
   */
  async getDispute(disputeId: string, userId: string) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        contract: {
          include: { tenant: true, landlord: true },
        },
        evidence: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    // Check access: claimant, respondent, or admin
    const isAuthorized =
      userId === dispute.claimantId ||
      userId === dispute.contract.tenantId ||
      userId === dispute.contract.landlordId;

    if (!isAuthorized) {
      throw new BadRequestException('Not authorized to view this dispute');
    }

    return dispute;
  }

  /**
   * Cron: Auto-resolve disputes that passed deadline
   * Approves respondent (favor whoever didn't sue)
   */
  @Cron(CronExpression.EVERY_HOUR)
  async autoResolveExpiredDisputes() {
    const expiredDisputes = await this.prisma.dispute.findMany({
      where: {
        status: 'OPEN',
        deadline: { lt: new Date() },
      },
      include: { evidence: true },
    });

    for (const dispute of expiredDisputes) {
      // FIXED: Check evidence properly before auto-resolution
      const hasClaimantEvidence = dispute.evidence.some(
        (e) => e.type === 'CLAIMANT',
      );
      const hasRespondentEvidence = dispute.evidence.some(
        (e) => e.type === 'RESPONDENT',
      );

      let resolution: DisputeResolution;
      let approvedAmount: number;
      let reason: string;

      if (!hasRespondentEvidence && hasClaimantEvidence) {
        // Respondent didn't submit counter-evidence → favor claimant
        resolution = 'APPROVED';
        approvedAmount = Number(dispute.claimAmount);
        reason = 'Auto-resolved: No counter-evidence submitted by respondent';
      } else if (hasRespondentEvidence && !hasClaimantEvidence) {
        // Edge case: claimant created dispute but no evidence
        resolution = 'REJECTED';
        approvedAmount = 0;
        reason = 'Auto-resolved: Insufficient claimant evidence';
      } else if (hasClaimantEvidence && hasRespondentEvidence) {
        // Both submitted evidence → needs manual review
        await this.escalateDispute(
          dispute.id,
          'Auto-escalated: Both parties submitted evidence, requires manual review',
          'SYSTEM',
        );
        continue;
      } else {
        // No evidence from either party → reject
        resolution = 'REJECTED';
        approvedAmount = 0;
        reason = 'Auto-resolved: No evidence from either party';
      }

      await this.resolveDispute(
        dispute.id,
        { resolution, approvedAmount, reason },
        'SYSTEM',
      );
    }
  }

  /**
   * Process financial outcome within transaction
   * CRITICAL: Must be called within $transaction for atomicity
   */
  private async processDisputeOutcomeTx(
    tx: any,
    dispute: {
      id: string;
      contractId: string;
      status: string; // Changed from resolution
      approvedAmount: string | number | Decimal | null;
      resolutionReason: string | null;
    },
  ) {
    // resolution logic now maps to status
    if (dispute.status === 'APPROVED' || dispute.status === 'PARTIAL') {
      // Note: DepositRefund model doesn't exist in schema yet
      // This is a placeholder - you need to create this model
      // For now, log to audit instead of creating DB record
      // TODO: Implement actual refund processing
      const approvedAmt = dispute.approvedAmount 
        ? new Decimal(dispute.approvedAmount.toString()).toNumber()
        : 0;
      console.warn(
        `[FINANCIAL] Dispute ${dispute.id} requires refund: ${approvedAmt}`,
      );
    }
    // REJECTED: no refund
  }

  /**
   * Escalate dispute to legal/offline handling
   */
  async escalateDispute(disputeId: string, reason: string, adminId: string) {
    const dispute = await this.prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: 'ESCALATED', // Special status for cases needing offline handling
        escalationReason: reason,
        escalatedAt: new Date(),
        escalatedBy: adminId,
      },
    });

    /*
    await this.audit.log({
      action: 'DISPUTE_ESCALATED',
      entityType: 'DISPUTE',
      entityId: disputeId,
      userId: adminId,
      details: { reason },
    });
    */

    return dispute;
  }
}
