import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class RegulationService {
  private readonly logger = new Logger(RegulationService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get active regulation for a specific type
   * FIX #10: Dynamic regulation lookup with expiry alerts
   */
  async getActiveRegulation(type: string, date: Date = new Date()) {
    const regulation = await this.prisma.regulationVersion.findFirst({
      where: {
        type,
        effectiveFrom: { lte: date },
        OR: [
          { effectiveTo: { gte: date } },
          { effectiveTo: null }, // No expiry
        ],
        deletedAt: null,
      },
      orderBy: {
        effectiveFrom: 'desc',
      },
    });

    if (!regulation) {
      this.logger.error(`❌ No active regulation found for type: ${type}`);
      throw new Error(`No active regulation for type: ${type}`);
    }

    // Check if expiring soon (within 30 days)
    if (regulation.effectiveTo) {
      const daysUntilExpiry = Math.floor(
        (regulation.effectiveTo.getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24),
      );

      if (daysUntilExpiry < 30 && daysUntilExpiry > 0) {
        this.logger.warn(
          `⚠️ Regulation ${type} v${regulation.version} expires in ${daysUntilExpiry} days!`,
        );
      } else if (daysUntilExpiry <= 0) {
        this.logger.error(
          `🚨 Regulation ${type} v${regulation.version} HAS EXPIRED!`,
        );
      }
    }

    return regulation;
  }

  /**
   * Check all regulations for expiry (daily cron)
   * FIX #10: Proactive regulation monitoring
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async checkExpiringRegulations() {
    this.logger.log('Running regulation expiry check...');

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // Find regulations expiring within 30 days
    const expiringSoon = await this.prisma.regulationVersion.findMany({
      where: {
        effectiveTo: {
          gte: new Date(),
          lte: thirtyDaysFromNow,
        },
        deletedAt: null,
      },
    });

    if (expiringSoon.length > 0) {
      this.logger.warn(
        `⚠️ ${expiringSoon.length} regulation(s) expiring within 30 days:`,
      );

      expiringSoon.forEach((reg) => {
        const daysUntilExpiry = Math.floor(
          (reg.effectiveTo!.getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24),
        );

        this.logger.warn(
          `  - ${reg.type} v${reg.version}: ${daysUntilExpiry} days remaining`,
        );
      });
    } else {
      this.logger.log('✅ No regulations expiring within 30 days');
    }

    // Find expired regulations (should have been replaced!)
    const expired = await this.prisma.regulationVersion.findMany({
      where: {
        effectiveTo: {
          lt: new Date(),
        },
        deletedAt: null,
      },
    });

    if (expired.length > 0) {
      this.logger.error(
        `🚨 ${expired.length} regulation(s) have EXPIRED and not replaced:`,
      );

      expired.forEach((reg) => {
        this.logger.error(`  - ${reg.type} v${reg.version}: EXPIRED`);
      });
    }

    return {
      expiringSoon: expiringSoon.length,
      expired: expired.length,
      regulations: [...expiringSoon, ...expired],
    };
  }
}
