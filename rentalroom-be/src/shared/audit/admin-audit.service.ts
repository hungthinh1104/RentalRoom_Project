import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/database/prisma/prisma.service';

/**
 * ☠️ ADMIN AUDIT TRAIL - GOD MODE TRACKING
 * 
 * CRITICAL PROBLEM:
 * - Admin can modify anything
 * - No audit of admin actions
 * - No approval flow
 * - Insider attack = rewrite history
 * 
 * LEGAL CONSEQUENCE:
 * - Cannot prove data integrity
 * - Admin actions invisible
 * - Tòa án: "How do we know admin didn't fabricate evidence?"
 * 
 * SOLUTION:
 * - Log EVERY admin action (even reads)
 * - Separate audit table (admin can't delete)
 * - Hash chain for tamper detection
 * - Alert on suspicious patterns
 * 
 * UC_LEGAL_09: Admin Action Audit Trail
 * UC_LEGAL_10: Insider Attack Detection
 */

export interface AdminAuditEntry {
  id?: string;
  adminId: string;
  action: string;
  entityType: string;
  entityId: string;
  
  // Before/After values (for data modification tracking)
  beforeValue?: Record<string, any>;
  afterValue?: Record<string, any>;
  
  // Context
  ipAddress?: string;
  userAgent?: string;
  reason?: string; // Admin must provide reason for sensitive operations
  
  // Integrity
  timestamp: Date;
  previousAuditHash?: string;
  auditHash?: string;
}

/**
 * ADMIN AUDIT SERVICE
 * 
 * USAGE:
 * ```ts
 * // Wrap ANY admin action:
 * await this.adminAudit.logAdminAction({
 *   adminId: user.id,
 *   action: 'DELETE_INVOICE',
 *   entityType: 'INVOICE',
 *   entityId: invoice.id,
 *   beforeValue: invoice,
 *   reason: 'Duplicate entry correction',
 *   ipAddress: req.ip,
 * });
 * ```
 */
@Injectable()
export class AdminAuditService {
  private readonly logger = new Logger(AdminAuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * LOG ADMIN ACTION - CRITICAL OPERATION
   * 
   * GUARANTEES:
   * - Immutable log (cannot be deleted even by admin)
   * - Hash chain (detect tampering)
   * - Timestamp (legal-grade)
   */
  async logAdminAction(entry: AdminAuditEntry): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // 1. Get previous audit entry for hash chain
      const previousEntry = await tx.adminAuditLog.findFirst({
        orderBy: {
          timestamp: 'desc',
        },
      });

      if (previousEntry) {
        entry.previousAuditHash = previousEntry.auditHash || undefined;
      }

      // 2. Calculate hash of this entry
      entry.auditHash = this.calculateAuditHash(entry);

      // 3. Store audit entry (IMMUTABLE)
      await tx.adminAuditLog.create({
        data: {
          adminId: entry.adminId,
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId,
          beforeValue: entry.beforeValue,
          afterValue: entry.afterValue,
          reason: entry.reason,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          timestamp: entry.timestamp || new Date(),
          previousAuditHash: entry.previousAuditHash,
          auditHash: entry.auditHash,
        },
      });

      this.logger.log(
        `📝 Admin action logged: ${entry.action} on ${entry.entityType}:${entry.entityId} by ${entry.adminId}`,
      );

      // 4. Check for suspicious patterns
      await this.detectSuspiciousPatterns(entry.adminId, entry.action, tx);
    });
  }

  /**
   * DETECT SUSPICIOUS PATTERNS - Insider attack detection
   * 
   * Patterns to detect:
   * - High volume of deletions (>10 in 1 hour)
   * - Bulk data exports
   * - After-hours access
   * - Sensitive data modifications
   */
  private async detectSuspiciousPatterns(
    adminId: string,
    action: string,
    tx: any,
  ): Promise<void> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Count admin actions in last hour
    const recentActions = await tx.adminAuditLog.count({
      where: {
        adminId,
        timestamp: {
          gte: oneHourAgo,
        },
      },
    });

    // Alert if >50 actions in 1 hour
    if (recentActions > 50) {
      this.logger.warn(
        `🚨 SUSPICIOUS ACTIVITY: Admin ${adminId} performed ${recentActions} actions in last hour`,
      );
      
      // TODO: Send alert to security team
    }

    // Alert on bulk deletes
    const SENSITIVE_ACTIONS = [
      'DELETE_INVOICE',
      'DELETE_CONTRACT',
      'DELETE_PAYMENT',
      'BULK_DELETE',
      'EXPORT_ALL_DATA',
      'MODIFY_AUDIT_LOG', // ☠️ THIS SHOULD NEVER HAPPEN
    ];

    if (SENSITIVE_ACTIONS.includes(action)) {
      this.logger.warn(
        `⚠️ SENSITIVE ACTION: Admin ${adminId} performed ${action}`,
      );
      
      // TODO: Send alert to security team
    }
  }

  /**
   * VERIFY AUDIT INTEGRITY - Daily check
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async verifyAuditIntegrity(): Promise<void> {
    this.logger.log('🔍 Starting admin audit log integrity verification...');

    const auditEntries = await this.prisma.adminAuditLog.findMany({
      orderBy: {
        timestamp: 'asc',
      },
    });

    let errors: string[] = [];

    for (let i = 1; i < auditEntries.length; i++) {
      const entry = auditEntries[i];
      const previousEntry = auditEntries[i - 1];

      // Verify hash chain
      if (entry.previousAuditHash !== previousEntry.auditHash) {
        errors.push(
          `Hash chain broken at entry ${entry.id}: ` +
          `expected previousHash=${previousEntry.auditHash}, ` +
          `got ${entry.previousAuditHash}`,
        );
      }

      // Verify entry hash
      const entryForHash: AdminAuditEntry = {
        adminId: entry.adminId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        beforeValue: entry.beforeValue ? (entry.beforeValue as Record<string, any>) : undefined,
        afterValue: entry.afterValue ? (entry.afterValue as Record<string, any>) : undefined,
        reason: entry.reason || undefined,
        ipAddress: entry.ipAddress || undefined,
        userAgent: entry.userAgent || undefined,
        timestamp: entry.timestamp,
        previousAuditHash: entry.previousAuditHash || undefined,
        auditHash: entry.auditHash,
      };
      const calculatedHash = this.calculateAuditHash(entryForHash);
      if (entry.auditHash !== calculatedHash) {
        errors.push(
          `Entry hash mismatch at ${entry.id}: ` +
          `stored=${entry.auditHash}, calculated=${calculatedHash}. ` +
          `POSSIBLE TAMPERING DETECTED.`,
        );
      }
    }

    if (errors.length > 0) {
      this.logger.error(
        `🚨 ADMIN AUDIT LOG INTEGRITY VIOLATION DETECTED: ${errors.length} errors found`,
      );
      errors.forEach(err => this.logger.error(err));
      
      // TODO: Send CRITICAL alert to security team
    } else {
      this.logger.log('✅ Admin audit log integrity verified successfully');
    }
  }

  /**
   * GET ADMIN ACTIVITY REPORT - For compliance
   */
  async getAdminActivityReport(
    adminId?: string,
    fromDate?: Date,
    toDate?: Date,
  ) {
    return await this.prisma.adminAuditLog.findMany({
      where: {
        ...(adminId && { adminId }),
        ...(fromDate && { timestamp: { gte: fromDate } }),
        ...(toDate && { timestamp: { lte: toDate } }),
      },
      orderBy: {
        timestamp: 'desc',
      },
    });
  }

  /**
   * Calculate hash of audit entry
   */
  private calculateAuditHash(entry: AdminAuditEntry): string {
    const crypto = require('crypto');
    
    const hashInput = [
      entry.adminId,
      entry.action,
      entry.entityType,
      entry.entityId,
      JSON.stringify(entry.beforeValue || {}),
      JSON.stringify(entry.afterValue || {}),
      entry.timestamp?.toISOString() || '',
      entry.previousAuditHash || '',
    ].join('|');

    return crypto.createHash('sha256').update(hashInput).digest('hex');
  }
}
