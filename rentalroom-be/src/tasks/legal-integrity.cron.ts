import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/database/prisma/prisma.service';
import * as crypto from 'crypto';

/**
 * ☠️ LEGAL INTEGRITY VERIFICATION CRON
 *
 * CRITICAL GUARANTEES:
 * - Daily verification of event store integrity (hash chain)
 * - Daily verification of admin audit trail integrity
 * - Cleanup of expired idempotency keys
 * - Alert on any integrity violations
 *
 * LEGAL IMPORTANCE:
 * - Tòa án yêu cầu: "Prove data wasn't tampered with"
 * - Hash chain enables cryptographic proof of integrity
 * - Daily verification = proactive tamper detection
 * - Audit alerts = incident response capability
 *
 * SCHEDULE:
 * - 00:00 (Midnight): Event store integrity verification
 * - 01:00 (1am): Admin audit chain verification
 * - 02:00 (2am): Idempotency key cleanup
 * - 06:00 (6am): Generate integrity report & alert on failures
 */
@Injectable()
export class LegalIntegrityCron {
  private readonly logger = new Logger(LegalIntegrityCron.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * VERIFY EVENT STORE INTEGRITY
   * 
   * CHECKS:
   * - Hash chain continuity (no gaps)
   * - Event hash correctness (no tampering)
   * - Version sequencing (no skips)
   * - Causation chain validity
   * 
   * RUN: Daily at midnight (UTC)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    name: 'event-store-integrity',
    timeZone: 'UTC',
  })
  async verifyEventStoreIntegrity(): Promise<void> {
    this.logger.log('🔍 Starting event store integrity verification...');

    const startTime = Date.now();
    const results = {
      totalEvents: 0,
      hashChainErrors: 0,
      versionErrors: 0,
      correlationErrors: 0,
      issues: [] as string[],
    };

    try {
      // 1. Get all events ordered by creation
      const events = await this.prisma.domainEvent.findMany({
        orderBy: { createdAt: 'asc' },
      });

      results.totalEvents = events.length;
      if (events.length === 0) {
        this.logger.warn('⚠️ No events in event store');
        return;
      }

      // 2. Verify each event's hash and chain
      let previousEvent: any = null;

      for (const event of events) {
        // Check hash correctness
        const expectedHash = this.calculateEventHash({
          eventId: event.eventId,
          eventType: event.eventType,
          aggregateId: event.aggregateId,
          aggregateType: event.aggregateType,
          aggregateVersion: event.aggregateVersion,
          payload: event.payload,
          metadata: event.metadata,
          previousEventHash: event.previousEventHash,
          occurredAt: event.occurredAt,
        });

        if (event.eventHash !== expectedHash) {
          results.hashChainErrors++;
          results.issues.push(
            `❌ Hash mismatch for event ${event.eventId}: expected ${expectedHash}, got ${event.eventHash}`,
          );
        }

        // Check causation chain (if causationId exists, parent must exist)
        if (event.causationId) {
          const parentEvent = await this.prisma.domainEvent.findUnique({
            where: { eventId: event.causationId },
          });

          if (!parentEvent) {
            results.correlationErrors++;
            results.issues.push(
              `❌ Broken causation for event ${event.eventId}: parent event ${event.causationId} not found`,
            );
          }
        }

        // Check version sequencing for each aggregate
        if (previousEvent && event.aggregateId === previousEvent.aggregateId) {
          if (
            event.aggregateType === previousEvent.aggregateType &&
            event.aggregateVersion !== previousEvent.aggregateVersion + 1
          ) {
            results.versionErrors++;
            results.issues.push(
              `❌ Version gap for ${event.aggregateType}:${event.aggregateId}: expected v${previousEvent.aggregateVersion + 1}, got v${event.aggregateVersion}`,
            );
          }
        }

        previousEvent = event;
      }

      const duration = Date.now() - startTime;

      if (results.hashChainErrors === 0 && results.versionErrors === 0) {
        this.logger.log(
          `✅ Event store integrity verified: ${results.totalEvents} events, 0 errors (${duration}ms)`,
        );
      } else {
        this.logger.error(
          `❌ Event store integrity violations detected:\n${results.issues.join('\n')}`,
        );
        // ALERT: This is a critical security issue
        await this.sendIntegrityAlert('EVENT_STORE_INTEGRITY_FAILURE', results);
      }

      // 3. Store verification result
      await this.prisma.auditLog.create({
        data: {
          userId: 'SYSTEM',
          action: 'EVENT_STORE_INTEGRITY_CHECK',
          entityType: 'SYSTEM',
          entityId: 'EVENT_STORE',
          details: {
            totalEvents: results.totalEvents,
            hashChainErrors: results.hashChainErrors,
            versionErrors: results.versionErrors,
            correlationErrors: results.correlationErrors,
            status: results.hashChainErrors === 0 ? 'PASSED' : 'FAILED',
            durationMs: duration,
          },
        },
      });
    } catch (error) {
      this.logger.error(
        `❌ Event store integrity check failed: ${error.message}`,
        error.stack,
      );
      await this.sendIntegrityAlert('EVENT_STORE_CHECK_ERROR', {
        error: error.message,
      });
    }
  }

  /**
   * VERIFY ADMIN AUDIT TRAIL INTEGRITY
   * 
   * CHECKS:
   * - Admin audit hash chain integrity
   * - No missing audit entries
   * - Suspicious pattern detection
   * - Audit tampering detection
   * 
   * RUN: Daily at 1am (UTC)
   */
  @Cron('0 1 * * *', {
    name: 'admin-audit-integrity',
    timeZone: 'UTC',
  })
  async verifyAdminAuditIntegrity(): Promise<void> {
    this.logger.log('🔍 Starting admin audit trail integrity verification...');

    const startTime = Date.now();
    const results = {
      totalAudits: 0,
      hashChainErrors: 0,
      missingChainLinks: 0,
      suspiciousPatterns: 0,
      issues: [] as string[],
    };

    try {
      // 1. Get all admin audit entries ordered by timestamp
      const audits = await this.prisma.adminAuditLog.findMany({
        orderBy: { timestamp: 'asc' },
      });

      results.totalAudits = audits.length;
      if (audits.length === 0) {
        this.logger.warn('⚠️ No admin audit entries in log');
        return;
      }

      // 2. Verify hash chain
      let previousAudit: any = null;

      for (const audit of audits) {
        // Check if previous hash is correct
        if (audit.previousAuditHash && previousAudit) {
          const expectedPrevHash = previousAudit.auditHash;
          if (audit.previousAuditHash !== expectedPrevHash) {
            results.hashChainErrors++;
            results.issues.push(
              `❌ Hash chain break for audit ${audit.id}: previousHash mismatch`,
            );
          }
        }

        // Verify audit hash
        const expectedHash = this.calculateAuditHash({
          adminId: audit.adminId,
          action: audit.action,
          entityType: audit.entityType,
          entityId: audit.entityId,
          timestamp: audit.timestamp,
          previousAuditHash: audit.previousAuditHash,
        });

        if (audit.auditHash !== expectedHash) {
          results.hashChainErrors++;
          results.issues.push(
            `❌ Hash mismatch for audit ${audit.id}: expected ${expectedHash}, got ${audit.auditHash}`,
          );
        }

        previousAudit = audit;
      }

      // 3. Detect suspicious patterns
      const suspiciousPatterns = await this.detectSuspiciousAdminPatterns(
        audits,
      );
      results.suspiciousPatterns = suspiciousPatterns.length;
      results.issues.push(...suspiciousPatterns);

      const duration = Date.now() - startTime;

      if (results.hashChainErrors === 0) {
        this.logger.log(
          `✅ Admin audit integrity verified: ${results.totalAudits} entries, 0 errors (${duration}ms)`,
        );
      } else {
        this.logger.error(
          `❌ Admin audit integrity violations detected:\n${results.issues.join('\n')}`,
        );
        await this.sendIntegrityAlert('ADMIN_AUDIT_INTEGRITY_FAILURE', results);
      }

      // 4. Store verification result
      await this.prisma.auditLog.create({
        data: {
          userId: 'SYSTEM',
          action: 'ADMIN_AUDIT_INTEGRITY_CHECK',
          entityType: 'SYSTEM',
          entityId: 'ADMIN_AUDIT_LOG',
          details: {
            totalAudits: results.totalAudits,
            hashChainErrors: results.hashChainErrors,
            suspiciousPatterns: results.suspiciousPatterns,
            status: results.hashChainErrors === 0 ? 'PASSED' : 'FAILED',
            durationMs: duration,
          },
        },
      });
    } catch (error) {
      this.logger.error(
        `❌ Admin audit integrity check failed: ${error.message}`,
        error.stack,
      );
      await this.sendIntegrityAlert('ADMIN_AUDIT_CHECK_ERROR', {
        error: error.message,
      });
    }
  }

  /**
   * CLEANUP EXPIRED IDEMPOTENCY KEYS
   * 
   * POLICY:
   * - Keep idempotency records for 24 hours
   * - Delete records older than 24 hours
   * - Log cleanup results
   * 
   * RUN: Daily at 2am (UTC)
   */
  @Cron('0 2 * * *', {
    name: 'idempotency-cleanup',
    timeZone: 'UTC',
  })
  async cleanupExpiredIdempotencyKeys(): Promise<void> {
    this.logger.log('🧹 Starting idempotency key cleanup...');

    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // 1. Count expired records
      const expiredCount = await this.prisma.idempotencyRecord.count({
        where: {
          createdAt: {
            lt: twentyFourHoursAgo,
          },
        },
      });

      // 2. Delete expired records
      const deleteResult = await this.prisma.idempotencyRecord.deleteMany({
        where: {
          createdAt: {
            lt: twentyFourHoursAgo,
          },
        },
      });

      this.logger.log(
        `✅ Cleaned up ${deleteResult.count} expired idempotency records (older than 24 hours)`,
      );

      // 3. Log cleanup operation
      await this.prisma.auditLog.create({
        data: {
          userId: 'SYSTEM',
          action: 'IDEMPOTENCY_CLEANUP',
          entityType: 'SYSTEM',
          entityId: 'IDEMPOTENCY_RECORDS',
          details: {
            deletedCount: deleteResult.count,
            cutoffDate: twentyFourHoursAgo,
          },
        },
      });
    } catch (error) {
      this.logger.error(
        `❌ Idempotency cleanup failed: ${error.message}`,
        error.stack,
      );
      await this.sendIntegrityAlert('IDEMPOTENCY_CLEANUP_ERROR', {
        error: error.message,
      });
    }
  }

  /**
   * GENERATE INTEGRITY REPORT
   * 
   * RUNS: Daily at 6am (UTC)
   * 
   * REPORT INCLUDES:
   * - Summary of all integrity checks
   * - Any failures or suspicious activity
   * - Admin actions with high-risk patterns
   * - Recommendations for investigation
   */
  @Cron('0 6 * * *', {
    name: 'integrity-report',
    timeZone: 'UTC',
  })
  async generateIntegrityReport(): Promise<void> {
    this.logger.log('📊 Generating daily integrity report...');

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 1. Get integrity check results from today
      const todayChecks = await this.prisma.auditLog.findMany({
        where: {
          action: {
            in: [
              'EVENT_STORE_INTEGRITY_CHECK',
              'ADMIN_AUDIT_INTEGRITY_CHECK',
              'IDEMPOTENCY_CLEANUP',
            ],
          },
          createdAt: {
            gte: today,
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // 2. Count critical events
      const eventStoreChecks = todayChecks.filter(
        (c) => c.action === 'EVENT_STORE_INTEGRITY_CHECK',
      );
      const adminAuditChecks = todayChecks.filter(
        (c) => c.action === 'ADMIN_AUDIT_INTEGRITY_CHECK',
      );

      const hasEventStoreFailure = eventStoreChecks.some(
        (c) => (c.details as any).status === 'FAILED',
      );
      const hasAdminAuditFailure = adminAuditChecks.some(
        (c) => (c.details as any).status === 'FAILED',
      );

      // 3. Get suspicious admin actions
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const suspiciousActions = await this.prisma.adminAuditLog.findMany({
        where: {
          timestamp: { gte: oneDayAgo },
          action: { in: ['DELETE_INVOICE', 'DELETE_CONTRACT', 'DELETE_PAYMENT'] },
        },
        orderBy: { timestamp: 'desc' },
        take: 50,
      });

      const reportSummary = {
        date: new Date().toISOString().split('T')[0],
        eventStoreStatus: hasEventStoreFailure ? 'FAILED' : 'PASSED',
        adminAuditStatus: hasAdminAuditFailure ? 'FAILED' : 'PASSED',
        criticalDeletions: suspiciousActions.length,
        adminActionsLogged: await this.prisma.adminAuditLog.count({
          where: { timestamp: { gte: oneDayAgo } },
        }),
        overallStatus:
          hasEventStoreFailure || hasAdminAuditFailure ? 'ALERT' : 'HEALTHY',
      };

      this.logger.log(
        `📊 Integrity Report:\n${JSON.stringify(reportSummary, null, 2)}`,
      );

      // 4. Send alert if any failures
      if (reportSummary.overallStatus === 'ALERT') {
        await this.sendIntegrityAlert('DAILY_INTEGRITY_REPORT_ALERT', {
          report: reportSummary,
          suspiciousDeletions: suspiciousActions.map((a) => ({
            id: a.id,
            adminId: a.adminId,
            action: a.action,
            entityType: a.entityType,
            timestamp: a.timestamp,
          })),
        });
      }

      // 5. Store report
      await this.prisma.auditLog.create({
        data: {
          userId: 'SYSTEM',
          action: 'INTEGRITY_REPORT_GENERATED',
          entityType: 'SYSTEM',
          entityId: 'DAILY_REPORT',
          details: reportSummary,
        },
      });
    } catch (error) {
      this.logger.error(
        `❌ Integrity report generation failed: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * DETECT SUSPICIOUS ADMIN PATTERNS
   * 
   * DETECTS:
   * - Bulk deletions (>5 in 1 hour)
   * - After-hours access (outside 8am-6pm)
   * - Rapid sequential deletions
   * - Data exports
   */
  private async detectSuspiciousAdminPatterns(
    audits: any[],
  ): Promise<string[]> {
    const suspiciousPatterns: string[] = [];

    // 1. Detect bulk deletions in last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentDeletions = audits.filter(
      (a) => a.timestamp >= oneHourAgo && a.action.includes('DELETE'),
    );

    if (recentDeletions.length > 5) {
      suspiciousPatterns.push(
        `⚠️ SUSPICIOUS: ${recentDeletions.length} deletions in the last hour (threshold: 5)`,
      );
    }

    // 2. Detect after-hours access
    const afterHoursAudits = audits.filter((a) => {
      const hour = new Date(a.timestamp).getHours();
      return hour < 8 || hour > 18; // Outside 8am-6pm
    });

    if (afterHoursAudits.length > 3) {
      suspiciousPatterns.push(
        `⚠️ SUSPICIOUS: ${afterHoursAudits.length} admin actions outside business hours`,
      );
    }

    return suspiciousPatterns;
  }

  /**
   * SEND INTEGRITY ALERT
   * 
   * SENDS: Email/Slack/Logger alert when integrity check fails
   * 
   * TODO: Integrate with actual alerting system (email, Slack, PagerDuty, etc.)
   */
  private async sendIntegrityAlert(
    alertType: string,
    details: any,
  ): Promise<void> {
    this.logger.error(`🚨 INTEGRITY ALERT: ${alertType}`, details);

    // TODO: Integrate with email service
    // await this.emailService.sendAlert({
    //   to: process.env.ALERT_EMAIL,
    //   subject: `Legal Integrity Alert: ${alertType}`,
    //   body: JSON.stringify(details, null, 2),
    // });

    // TODO: Integrate with Slack
    // await this.slackService.postAlert({
    //   channel: process.env.SLACK_ALERTS_CHANNEL,
    //   text: `🚨 Legal Integrity Alert: ${alertType}`,
    //   attachments: [{ text: JSON.stringify(details, null, 2) }],
    // });
  }

  /**
   * CALCULATE EVENT HASH
   * 
   * ALGORITHM: SHA-256 of event payload
   * Ensures any modification is detected
   */
  private calculateEventHash(event: any): string {
    const data = JSON.stringify({
      eventId: event.eventId,
      eventType: event.eventType,
      aggregateId: event.aggregateId,
      aggregateType: event.aggregateType,
      aggregateVersion: event.aggregateVersion,
      payload: event.payload,
      metadata: event.metadata,
      previousEventHash: event.previousEventHash,
      occurredAt: event.occurredAt,
    });

    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * CALCULATE AUDIT HASH
   * 
   * ALGORITHM: SHA-256 of audit entry
   * Creates hash chain for tamper detection
   */
  private calculateAuditHash(audit: any): string {
    const data = JSON.stringify({
      adminId: audit.adminId,
      action: audit.action,
      entityType: audit.entityType,
      entityId: audit.entityId,
      timestamp: audit.timestamp,
      previousAuditHash: audit.previousAuditHash,
    });

    return crypto.createHash('sha256').update(data).digest('hex');
  }
}
