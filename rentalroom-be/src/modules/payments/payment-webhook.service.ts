import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import * as crypto from 'crypto';

interface WebhookPayload {
  transactionId: string;
  amount: number;
  invoiceId: string;
  tenantId: string;
  paidAt: string;
  bankCode?: string;
  description?: string;
}

@Injectable()
export class PaymentWebhookService {
  private readonly logger = new Logger(PaymentWebhookService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Handle SePay webhook with idempotency
   * Prevents duplicate processing and handles retries
   */
  async handleSepayWebhook(
    payload: WebhookPayload,
    signature: string,
  ): Promise<{ status: string; message?: string }> {
    // 1. Verify signature (prevent fake requests)
    const isValid = this.verifySignature(payload, signature);
    if (!isValid) {
      this.logger.warn(`Invalid webhook signature: ${payload.transactionId}`);
      throw new Error('Invalid webhook signature');
    }

    // 2. Check if already processed (idempotency)
    const existing = await this.prisma.payment.findUnique({
      where: { transactionId: payload.transactionId },
    });

    if (existing) {
      this.logger.warn(`Duplicate webhook received: ${payload.transactionId}`);
      return {
        status: 'already_processed',
        message: 'Transaction already processed',
      };
    }

    // 3. Process payment in transaction (ACID guarantee)
    try {
      await this.prisma.$transaction(async (tx) => {
        // Create payment record
        await tx.payment.create({
          data: {
            invoiceId: payload.invoiceId,
            tenantId: payload.tenantId || '', // Assuming tenant ID from payload
            transactionId: payload.transactionId,
            amount: payload.amount,
            paymentMethod: 'BANK_TRANSFER',
            status: 'COMPLETED',
            paidAt: new Date(payload.paidAt),
          },
        });

        // Update invoice status
        await tx.invoice.update({
          where: { id: payload.invoiceId },
          data: {
            status: 'PAID',
            paidAt: new Date(payload.paidAt),
          },
        });

        this.logger.log(
          `Payment processed successfully: ${payload.transactionId}`,
        );
      });

      return { status: 'success' };
    } catch (error) {
      // Log error for manual reconciliation
      await this.logWebhookFailure(payload, error);
      throw error; // Bank will retry
    }
  }

  /**
   * Verify webhook signature using HMAC SHA-256
   */
  private verifySignature(payload: any, signature: string): boolean {
    if (signature === 'INTERNAL_RETRY') return true;

    const secretKey = process.env.SEPAY_SECRET_KEY || 'default-secret';
    const computedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(JSON.stringify(payload))
      .digest('hex');

    return computedSignature === signature;
  }

  /**
   * Log webhook failure for manual reconciliation
   */
  private async logWebhookFailure(payload: any, error: any) {
    this.logger.error('Webhook failure:', { payload, error });
    try {
      await this.prisma.webhookFailure.create({
        data: {
          provider: 'SEPAY',
          payload: JSON.stringify(payload),
          error: error.message || String(error),
          retryCount: 0,
        },
      });
    } catch (logError) {
      this.logger.error('Failed to log webhook failure:', logError);
    }
  }

  /**
   * Retry failed webhooks (called by cron job)
   */
  async retryFailedWebhooks() {
    const failures = await this.prisma.webhookFailure.findMany({
      where: { retryCount: { lt: 5 } },
      take: 10,
    });

    for (const failure of failures) {
      try {
        const payload = JSON.parse(failure.payload);
        // Retry logic: note that we skip signature check for internal retries
        // but we ensure idempotency via transactionId check in handle method
        await this.handleSepayWebhook(payload, 'INTERNAL_RETRY');

        // Delete if successful
        await this.prisma.webhookFailure.delete({
          where: { id: failure.id },
        });

        this.logger.log(`Retry successful: ${failure.id}`);
      } catch (error) {
        // Increment retry count
        await this.prisma.webhookFailure.update({
          where: { id: failure.id },
          data: { retryCount: { increment: 1 } },
        });

        this.logger.error(`Retry failed: ${failure.id}`, error);
      }
    }
    return failures;
  }
}
