import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma/prisma.service';

@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  constructor(private readonly prisma: PrismaService) { }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCleanup() {
    this.logger.log('Starting daily cleanup task...');

    try {
      // 1. Delete AI Logs older than 3 months
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const deletedLogs = await this.prisma.aiInteractionLog.deleteMany({
        where: {
          createdAt: {
            lt: threeMonthsAgo,
          },
        },
      });
      this.logger.log(`Deleted ${deletedLogs.count} old AI interaction logs.`);

      // 2. Delete Read Notifications older than 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const deletedNotifications = await this.prisma.notification.deleteMany({
        where: {
          isRead: true,
          createdAt: {
            lt: sixMonthsAgo,
          },
        },
      });
      this.logger.log(
        `Deleted ${deletedNotifications.count} old read notifications.`,
      );

      // 3. Expire ending contracts (Pass endDate)
      // Contracts that are ACTIVE but end date is in the past
      const now = new Date();

      const expiredContracts = await this.prisma.contract.findMany({
        where: {
          status: 'ACTIVE', // Use string literal or import enum if available
          endDate: { lt: now }, // End date is in the past
        },
        include: { room: true },
        take: 50, // Process in batches to avoid timeout
      });

      if (expiredContracts.length > 0) {
        this.logger.log(`Found ${expiredContracts.length} expired contracts. Processing...`);

        for (const contract of expiredContracts) {
          try {
            await this.prisma.$transaction(async (tx) => {
              // Set contract to EXPIRED
              await tx.contract.update({
                where: { id: contract.id },
                data: { status: 'EXPIRED' }, // ContractStatus.EXPIRED
              });

              // Set room to AVAILABLE
              await tx.room.update({
                where: { id: contract.roomId },
                data: { status: 'AVAILABLE' }, // RoomStatus.AVAILABLE
              });
            });
            this.logger.log(`Expired contract ${contract.id} and unlocked room ${contract.roomId}`);
          } catch (e) {
            this.logger.error(`Failed to expire contract ${contract.id}`, e);
          }
        }
      }

      // 4. Cancel unpaid deposits (Pass depositDeadline)
      // Contracts that are DEPOSIT_PENDING but passed deadline
      const overdueContracts = await this.prisma.contract.findMany({
        where: {
          status: 'DEPOSIT_PENDING',
          depositDeadline: { lt: now },
        },
        include: { room: true },
        take: 50,
      });

      if (overdueContracts.length > 0) {
        this.logger.log(`Found ${overdueContracts.length} overdue deposit contracts. Cancelling...`);

        for (const contract of overdueContracts) {
          try {
            await this.prisma.$transaction(async (tx) => {
              // Set contract to CANCELLED
              await tx.contract.update({
                where: { id: contract.id },
                data: { status: 'CANCELLED' }, // ContractStatus.CANCELLED
              });

              // Set room to AVAILABLE (if it was RESERVED or DEPOSIT_PENDING reserved)
              // Note: Room might be RESERVED or AVAILABLE depending on implementation, but resetting to AVAILABLE is safe
              await tx.room.update({
                where: { id: contract.roomId },
                data: { status: 'AVAILABLE' },
              });
            });
            this.logger.log(`Cancelled overdue contract ${contract.id} and unlocked room ${contract.roomId}`);
          } catch (e) {
            this.logger.error(`Failed to cancel overdue contract ${contract.id}`, e);
          }
        }
      }

      // 5. Cleanup stale negotiation contracts (DRAFT / PENDING_SIGNATURE > 7 days)
      const staleDate = new Date();
      staleDate.setDate(staleDate.getDate() - 7);

      const staleContracts = await this.prisma.contract.findMany({
        where: {
          status: { in: ['DRAFT', 'PENDING_SIGNATURE'] },
          updatedAt: { lt: staleDate },
        },
        include: { room: true },
        take: 50,
      });

      if (staleContracts.length > 0) {
        this.logger.log(`Found ${staleContracts.length} stale negotiation contracts. Cancelling...`);
        for (const contract of staleContracts) {
          try {
            await this.prisma.$transaction(async (tx) => {
              await tx.contract.update({
                where: { id: contract.id },
                data: {
                  status: 'CANCELLED',
                  terminationReason: 'Auto-cancelled due to inactivity (7 days)'
                },
              });

              await tx.room.update({
                where: { id: contract.roomId },
                data: { status: 'AVAILABLE' },
              });
            });
            this.logger.log(`Cancelled stale contract ${contract.id}`);
          } catch (e) {
            this.logger.error(`Failed to cancel stale contract ${contract.id}`, e);
          }
        }
      }
    } catch (error) {
      this.logger.error('Error during cleanup task', error);
    }
  }
}
