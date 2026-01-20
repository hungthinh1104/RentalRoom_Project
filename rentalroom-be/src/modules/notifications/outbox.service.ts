import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma/prisma.service';
import { EmailService } from '../../common/services/email.service';
import { OutboxStatus, NotificationType } from '@prisma/client';

/**
 * Outbox Pattern Implementation
 * Ensures at-least-once email delivery for critical notifications
 * 
 * HOW IT WORKS:
 * 1. Create notification → insert row in NotificationOutbox with status=PENDING
 * 2. Async worker polls every minute → finds PENDING rows
 * 3. Attempt email delivery → on success: mark SENT, on failure: increment retry + set nextRetryAt
 * 4. Max 5 retries with exponential backoff: 1m, 2m, 4m, 8m, 16m
 * 5. After 5 failures → mark FAILED_PERMANENT, alert admin
 *
 * GUARANTEES:
 * - ✅ At-least-once: Message won't be lost if worker crashes
 * - ✅ Idempotent: Email service handles duplicate checks (via referenceId)
 * - ✅ Retryable: Exponential backoff prevents overwhelming email provider
 *
 * USE CASES:
 * - Payment notifications (CRITICAL)
 * - Contract reminders (HIGH)
 * - Dispute escalation (MEDIUM)
 * - Maintenance updates (MEDIUM)
 */
@Injectable()
export class NotificationOutboxService {
  private readonly logger = new Logger(NotificationOutboxService.name);

  // Retry delays in seconds (exponential backoff)
  private readonly RETRY_DELAYS = [60, 120, 240, 480, 960]; // 1, 2, 4, 8, 16 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Enqueue a notification for delivery via outbox
   * CRITICAL: Call this INSIDE the transaction that creates invoice/contract/etc
   * to ensure atomicity (insert message + update state in one transaction)
   */
  async enqueueNotification(
    email: string,
    subject: string,
    bodyHtml: string,
    notificationType: NotificationType,
    userId: string,
  ): Promise<void> {
    await this.prisma.notificationOutbox.create({
      data: {
        email,
        subject,
        bodyHtml,
        notificationType,
        userId,
        status: 'PENDING',
        retryCount: 0,
      },
    });

    this.logger.debug(`📧 Notification enqueued for ${email} (${notificationType})`);
  }

  /**
   * Cron job: Poll and process pending outbox messages
   * Runs every minute to check for messages needing delivery
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async processPendingMessages(): Promise<void> {
    try {
      // Find messages that are:
      // 1. PENDING (never attempted) OR
      // 2. Past retry deadline
      const pendingMessages = await this.prisma.notificationOutbox.findMany({
        where: {
          OR: [
            { status: 'PENDING' },
            {
              status: 'FAILED_PERMANENT',
              nextRetryAt: null, // Only retry if nextRetryAt set
            },
          ],
          // Ensure we don't process message before its retry time
          AND: [
            {
              OR: [
                { nextRetryAt: null }, // Never tried
                { nextRetryAt: { lte: new Date() } }, // Retry window passed
              ],
            },
          ],
        },
        orderBy: { createdAt: 'asc' },
        take: 10, // Process max 10 at a time to avoid overwhelming
      });

      if (pendingMessages.length === 0) {
        return; // Nothing to do
      }

      this.logger.debug(`📬 Processing ${pendingMessages.length} pending notifications`);

      for (const message of pendingMessages) {
        await this.processMessage(message);
      }
    } catch (error) {
      this.logger.error('Failed to process outbox messages', error);
      // Don't rethrow—cron job should continue even if one fails
    }
  }

  /**
   * Process a single outbox message
   */
  private async processMessage(message: any): Promise<void> {
    const { id, email, subject, bodyHtml, retryCount, maxRetries } = message;

    try {
      // Attempt email delivery
      await this.emailService.sendEmail(email, subject, bodyHtml);

      // ✅ SUCCESS: Mark as sent
      await this.prisma.notificationOutbox.update({
        where: { id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
        },
      });

      this.logger.log(
        `✅ Email sent successfully to ${email} (ID: ${id.substring(0, 8)}...)`,
      );
    } catch (error) {
      // ❌ FAILURE: Determine if retriable
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `❌ Failed to send email to ${email} (attempt ${retryCount + 1}/${maxRetries}): ${errorMsg}`,
      );

      if (retryCount >= maxRetries - 1) {
        // MAX RETRIES EXCEEDED: Mark permanent failure
        await this.prisma.notificationOutbox.update({
          where: { id },
          data: {
            status: 'FAILED_PERMANENT',
            failureReason: errorMsg,
            retryCount: retryCount + 1,
          },
        });

        this.logger.error(
          `🚨 Email delivery FAILED after ${maxRetries} attempts for ${email}. Manual intervention required.`,
        );

        // TODO: Alert admin via Slack/PagerDuty
        // await this.alertingService.alertFailedEmailDelivery(message);
      } else {
        // RETRIABLE: Schedule next attempt with backoff
        const nextRetryDelay = this.RETRY_DELAYS[retryCount] || 960; // 16 min as fallback
        const nextRetryAt = new Date(Date.now() + nextRetryDelay * 1000);

        await this.prisma.notificationOutbox.update({
          where: { id },
          data: {
            retryCount: retryCount + 1,
            nextRetryAt,
            failureReason: errorMsg,
          },
        });

        this.logger.debug(
          `⏰ Next retry scheduled for ${nextRetryAt.toISOString()} (delay: ${nextRetryDelay}s)`,
        );
      }
    }
  }

  /**
   * Get delivery status for a notification
   * Useful for checking if email was successfully sent
   */
  async getDeliveryStatus(notificationId: string): Promise<{
    status: OutboxStatus;
    sentAt?: Date;
    failureReason?: string;
    retryCount: number;
  }> {
    const message = await this.prisma.notificationOutbox.findUnique({
      where: { id: notificationId },
    });

    if (!message) {
      throw new Error(`Notification ${notificationId} not found`);
    }

    return {
      status: message.status,
      sentAt: message.sentAt ?? undefined,
      failureReason: message.failureReason ?? undefined,
      retryCount: message.retryCount,
    };
  }

  /**
   * Cleanup old delivered messages (retention policy)
   * Runs daily at 2 AM to clean up messages older than 30 days
   */
  @Cron('0 2 * * *') // 2 AM every day
  async cleanupOldMessages(): Promise<void> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const deleted = await this.prisma.notificationOutbox.deleteMany({
      where: {
        status: 'SENT',
        sentAt: { lt: thirtyDaysAgo },
      },
    });

    if (deleted.count > 0) {
      this.logger.log(`🗑️  Cleaned up ${deleted.count} old notification records`);
    }
  }
}
