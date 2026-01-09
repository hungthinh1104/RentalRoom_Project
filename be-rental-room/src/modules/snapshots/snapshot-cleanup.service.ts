import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma/prisma.service';

@Injectable()
export class SnapshotCleanupService {
  private readonly logger = new Logger(SnapshotCleanupService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Check for orphaned snapshots weekly
   * FIX #9: Orphaned snapshot detection
   *
   * NOTE: We DON'T delete orphaned snapshots (immutable audit trail)
   * We only LOG them for manual review
   */
  @Cron(CronExpression.EVERY_WEEK) // Run every Sunday at midnight
  async detectOrphanedSnapshots() {
    this.logger.log('Running orphaned snapshot detection...');

    try {
      // Get all snapshots
      const allSnapshots = await this.prisma.legalSnapshot.findMany({
        select: {
          id: true,
          actionType: true,
          entityType: true,
          entityId: true,
          createdAt: true,
        },
        take: 1000, // Limit for performance
      });

      const orphaned: typeof allSnapshots = [];

      // Check each snapshot for valid entity link
      for (const snapshot of allSnapshots) {
        let isOrphaned = false;

        try {
          if (snapshot.entityType === 'CONTRACT') {
            const contract = await this.prisma.contract.findUnique({
              where: { id: snapshot.entityId },
              select: { id: true, snapshotId: true },
            });
            isOrphaned = !contract || contract.snapshotId !== snapshot.id;
          } else if (snapshot.entityType === 'PAYMENT') {
            const payment = await this.prisma.payment.findUnique({
              where: { id: snapshot.entityId },
              select: { id: true, snapshotId: true },
            });
            isOrphaned = !payment || payment.snapshotId !== snapshot.id;
          } else if (snapshot.entityType === 'CONSENT') {
            const consentLog = await this.prisma.consentLog.findFirst({
              where: { snapshotId: snapshot.id },
              select: { id: true },
            });
            isOrphaned = !consentLog;
          }

          if (isOrphaned) {
            orphaned.push(snapshot);
          }
        } catch (err) {
          // Entity might not exist, mark as orphaned
          orphaned.push(snapshot);
        }
      }

      if (orphaned.length > 0) {
        this.logger.warn(`⚠️ Found ${orphaned.length} orphaned snapshots`);

        // Log first 10 for investigation
        orphaned.slice(0, 10).forEach((s) => {
          this.logger.warn(
            `Orphan: ${s.id} | ${s.actionType} | ${s.entityType}/${s.entityId}`,
          );
        });
      } else {
        this.logger.log('✅ No orphaned snapshots found');
      }

      return {
        total: orphaned.length,
        snapshots: orphaned.slice(0, 100),
      };
    } catch (error) {
      this.logger.error('Failed to detect orphaned snapshots', error);
      return { total: 0, snapshots: [], error: error.message };
    }
  }

  /**
   * Manual trigger for on-demand check
   */
  async checkNow() {
    return this.detectOrphanedSnapshots();
  }
}
