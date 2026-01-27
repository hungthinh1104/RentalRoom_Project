import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { UserRole, Prisma } from '@prisma/client';
import * as crypto from 'crypto';

export interface CreateSnapshotDto {
  actorId: string;
  actorRole: UserRole;
  actionType: string;
  entityType: string;
  entityId: string;
  timestamp?: Date;
  ipAddress?: string;
  userAgent?: string;
  city?: string;
  metadata?: Record<string, any>;
}

export interface RegulationRef {
  type: string;
  version: string;
  hash: string;
}

export interface DocumentRef {
  type: string;
  version: string;
  hash: string;
}

@Injectable()
export class SnapshotService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create immutable legal snapshot
   * Core principle: Capture what happened, when, and under what regulations
   *
   * ⚠️ CRITICAL: Snapshot MUST succeed or transaction fails
   * Legal audit trail is non-negotiable. Failure = rollback everything.
   *
   * @param dto Snapshot data
   * @param tx Prisma transaction (REQUIRED - snapshot must be atomic with action)
   * @throws Error if snapshot creation fails
   */
  async create(
    dto: CreateSnapshotDto,
    tx: Prisma.TransactionClient,
  ): Promise<string> {
    const timestamp = dto.timestamp || new Date();
    const prisma = tx;

    // 1. Lookup active regulations at this timestamp
    const regulations = await this.getActiveRegulations(timestamp, prisma);

    // 2. Get active document versions (MVP: hardcoded, can be DB later)
    const documentVersions = await this.getActiveDocumentVersions(prisma);

    // 3. Generate immutable hash
    const snapshotData = {
      actorId: dto.actorId,
      actorRole: dto.actorRole,
      actionType: dto.actionType,
      entityType: dto.entityType,
      entityId: dto.entityId,
      timestamp: timestamp.toISOString(),
      ipAddress: dto.ipAddress || null,
      userAgent: dto.userAgent || null,
      city: dto.city || null,
      regulations,
      documentVersions,
      metadata: dto.metadata || {},
    };

    const dataHash = this.generateHash(snapshotData);

    const previousSnapshot = await prisma.legalSnapshot.findFirst({
      orderBy: { timestamp: 'desc' },
    });

    const previousHash =
      previousSnapshot?.chainHash || previousSnapshot?.dataHash || null;

    const chainHash = this.generateChainHash(dataHash, previousHash);

    // 4. Create snapshot (immutable) - use transaction if provided
    const snapshot = await prisma.legalSnapshot.create({
      data: {
        actorId: dto.actorId,
        actorRole: dto.actorRole,
        actionType: dto.actionType,
        entityType: dto.entityType,
        entityId: dto.entityId,
        timestamp,
        ipAddress: dto.ipAddress || null,
        userAgent: dto.userAgent || null,
        city: dto.city || null,
        regulations: regulations as any,
        documentVersions: documentVersions as any,
        dataHash,
        previousHash,
        chainHash,
        metadata: dto.metadata,
      },
    });

    return snapshot.id;
  }

  /**
   * Lookup active regulations at specific timestamp
   * MVP: Only RENTAL_TAX regulation
   * @param tx Optional Prisma transaction
   */
  private async getActiveRegulations(
    timestamp: Date,
    tx?: Prisma.TransactionClient | PrismaService,
  ): Promise<RegulationRef[]> {
    const prisma = (tx as Prisma.TransactionClient) || this.prisma;
    const regulations = await prisma.regulationVersion.findMany({
      where: {
        effectiveFrom: { lte: timestamp },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: timestamp } }],
        deletedAt: null,
      },
    });

    return regulations.map((r) => ({
      type: r.type,
      version: r.version,
      hash: r.contentHash,
    }));
  }

  /**
   * Get active document versions (Privacy Policy, Terms, etc.)
   * MVP: Hardcoded v1.0, can move to DB in Phase 2
   */
  private async getActiveDocumentVersions(
    tx?: Prisma.TransactionClient | PrismaService,
  ): Promise<DocumentRef[]> {
    const prisma = (tx as Prisma.TransactionClient) || this.prisma;
    const docs = await prisma.legalDocument.findMany({
      where: {
        isPublished: true,
        deletedAt: null,
      },
      include: {
        currentVersion: true,
      },
    });

    return docs
      .filter((doc) => doc.currentVersion)
      .map((doc) => ({
        type: doc.type,
        version: doc.currentVersion?.version || 'unknown',
        hash: doc.currentVersion?.contentHash || '',
      }));
  }

  /**
   * Generate SHA-256 hash for immutability
   * Snapshot data becomes immutable evidence
   */
  private generateHash(data: any): string {
    const canonical = JSON.stringify(data, Object.keys(data).sort());
    return crypto.createHash('sha256').update(canonical).digest('hex');
  }

  private generateChainHash(dataHash: string, previousHash: string | null) {
    const input = `${previousHash || 'GENESIS'}:${dataHash}`;
    return crypto.createHash('sha256').update(input).digest('hex');
  }

  /**
   * Helper: Hash a string
   */
  private hashString(input: string): string {
    return crypto.createHash('sha256').update(input).digest('hex');
  }

  /**
   * Verify snapshot integrity
   * Used for audit/dispute resolution
   */
  async verify(snapshotId: string): Promise<boolean> {
    const snapshot = await this.prisma.legalSnapshot.findUnique({
      where: { id: snapshotId },
    });

    if (!snapshot) {
      throw new Error('Snapshot not found');
    }

    // Reconstruct hash
    const reconstructed = {
      actorId: snapshot.actorId,
      actorRole: snapshot.actorRole,
      actionType: snapshot.actionType,
      entityType: snapshot.entityType,
      entityId: snapshot.entityId,
      timestamp: snapshot.timestamp.toISOString(),
      ipAddress: snapshot.ipAddress,
      userAgent: snapshot.userAgent,
      city: snapshot.city,
      regulations: snapshot.regulations,
      documentVersions: snapshot.documentVersions,
      metadata: snapshot.metadata || {},
    };

    const expectedHash = this.generateHash(reconstructed);
    const expectedChainHash = this.generateChainHash(
      expectedHash,
      snapshot.previousHash ?? null,
    );

    const dataHashOk = expectedHash === snapshot.dataHash;
    const chainHashOk = snapshot.chainHash
      ? expectedChainHash === snapshot.chainHash
      : true;

    return dataHashOk && chainHashOk;
  }

  /**
   * Find snapshots by entity
   * For audit trail / evidence export
   */
  async findByEntity(entityType: string, entityId: string) {
    return this.prisma.legalSnapshot.findMany({
      where: {
        entityType,
        entityId,
      },
      orderBy: {
        timestamp: 'asc',
      },
    });
  }

  /**
   * Find all snapshots with filtering and pagination
   * For Admin Audit Log UI
   */
  async findAll(params: {
    skip?: number;
    take?: number;
    actionType?: string;
    entityType?: string;
    actorId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const { skip, take, actionType, entityType, actorId, startDate, endDate } =
      params;

    const where: Prisma.LegalSnapshotWhereInput = {
      ...(actionType && { actionType }),
      ...(entityType && { entityType }),
      ...(actorId && { actorId }),
      ...(startDate || endDate
        ? {
            timestamp: {
              ...(startDate && { gte: startDate }),
              ...(endDate && { lte: endDate }),
            },
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.legalSnapshot.findMany({
        where,
        skip,
        take,
        orderBy: { timestamp: 'desc' },
      }),
      this.prisma.legalSnapshot.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page: Math.floor((skip || 0) / (take || 10)) + 1,
        lastPage: Math.ceil(total / (take || 10)),
      },
    };
  }
}
