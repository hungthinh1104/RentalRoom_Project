import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { SnapshotService } from '../snapshots/snapshot.service';
import { UserRole } from '@prisma/client';
import * as crypto from 'crypto';

export interface RecordConsentDto {
  userId: string;
  userRole: UserRole;
  documentType: string; // privacy_policy, terms_of_service, ai_consent
  documentVersion: string;
  action: 'GRANTED' | 'REVOKED' | 'UPDATED';
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class ConsentService {
  private readonly logger = new Logger(ConsentService.name);

  constructor(
    private prisma: PrismaService,
    private snapshotService: SnapshotService,
  ) {}

  /**
   * Record consent action (Grant/Revoke/Update)
   * Creates immutable snapshot + consent log for PDPL compliance
   * FIX: Wrapped in transaction for atomicity
   */
  async recordConsent(dto: RecordConsentDto) {
    const documentHash = this.hashDocument(
      dto.documentType,
      dto.documentVersion,
    );

    // Use transaction to ensure snapshot + consent log created atomically
    return await this.prisma.$transaction(async (tx) => {
      // Create legal snapshot first (pass transaction)
      const snapshotId = await this.snapshotService.create(
        {
          actorId: dto.userId,
          actorRole: dto.userRole,
          actionType: 'consent_updated',
          entityType: 'CONSENT',
          entityId: dto.userId,
          ipAddress: dto.ipAddress,
          userAgent: dto.userAgent,
          metadata: {
            documentType: dto.documentType,
            documentVersion: dto.documentVersion,
            action: dto.action,
          },
        },
        tx,
      );

      // Create consent log (in same transaction)
      const consentLog = await tx.consentLog.create({
        data: {
          userId: dto.userId,
          documentType: dto.documentType,
          documentVersion: dto.documentVersion,
          documentHash,
          action: dto.action,
          ipAddress: dto.ipAddress,
          userAgent: dto.userAgent,
          snapshotId,
        },
      });

      this.logger.log(
        `Consent ${dto.action} recorded for user ${dto.userId} - ${dto.documentType} v${dto.documentVersion}`,
      );

      return consentLog;
    });
  }

  /**
   * Get consent history for a user
   */
  async getUserConsents(userId: string, documentType?: string) {
    return this.prisma.consentLog.findMany({
      where: {
        userId,
        ...(documentType && { documentType }),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Check if user has active consent for a document type
   */
  async hasActiveConsent(
    userId: string,
    documentType: string,
  ): Promise<boolean> {
    const latest = await this.prisma.consentLog.findFirst({
      where: {
        userId,
        documentType,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return latest?.action === 'GRANTED';
  }

  /**
   * Hash document identifier for integrity
   */
  private hashDocument(type: string, version: string): string {
    return crypto
      .createHash('sha256')
      .update(`${type}:${version}`)
      .digest('hex');
  }
}
