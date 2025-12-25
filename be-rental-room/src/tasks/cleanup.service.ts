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
            this.logger.log(`Deleted ${deletedNotifications.count} old read notifications.`);

        } catch (error) {
            this.logger.error('Error during cleanup task', error);
        }
    }
}
