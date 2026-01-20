import { Injectable, NestMiddleware, ConflictException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../database/prisma/prisma.service';

/**
 * Payment Idempotency Middleware
 *
 * UC_PAY_01: Prevent duplicate payment processing via TransactionID
 * Ensures same transaction cannot be processed twice
 * Returns cached response if duplicate detected
 */
@Injectable()
export class PaymentIdempotencyMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Only apply to payment endpoints
    if (!this.isPaymentEndpoint(req.path)) {
      return next();
    }

    // Extract TransactionID from request body
    const transactionId = req.body?.transactionId || req.body?.transaction_id;

    if (!transactionId) {
      return next();
    }

    try {
      // Check if transaction already processed
      const existingTransaction =
        await this.prisma.paymentTransaction.findUnique({
          where: { transactionId },
        });

      if (existingTransaction) {
        // Transaction already processed, return cached response
        if (existingTransaction.status === 'SUCCESS') {
          return res.status(200).json({
            success: true,
            message: 'Transaction already processed (cached)',
            transactionId,
            amount: existingTransaction.amount,
            processedAt: existingTransaction.processedAt,
          });
        } else if (existingTransaction.status === 'FAILED') {
          return res.status(400).json({
            success: false,
            message: 'Transaction previously failed',
            transactionId,
            error: existingTransaction.errorDetails,
          });
        } else if (existingTransaction.status === 'PENDING') {
          // Still processing, don't allow duplicate
          throw new ConflictException(
            'Transaction still processing, please wait',
          );
        }
      }

      // Record this transaction ID as pending
      await this.prisma.paymentTransaction.create({
        data: {
          transactionId,
          status: 'PENDING',
          amount: req.body?.amount || 0,
          referenceCode: req.body?.referenceCode || `TXN-${Date.now()}`,
          paymentMethod: req.body?.paymentMethod || 'UNKNOWN',
        },
      });

      // Store original send/json to intercept response
      const originalSend = res.send;
      const originalJson = res.json;

      // Wrap response handlers
      res.send = function (data: any) {
        res.send = originalSend;
        return res.json(data);
      };

      res.json = function (data: any) {
        res.json = originalJson;

        // Update transaction status based on response
        const isSuccess = res.statusCode >= 200 && res.statusCode < 300;

        this.prisma.paymentTransaction
          .update({
            where: { transactionId },
            data: {
              status: isSuccess ? 'SUCCESS' : 'FAILED',
              responseData: data,
              processedAt: new Date(),
              errorDetails: !isSuccess ? JSON.stringify(data) : null,
            },
          })
          .catch(console.error);

        return originalJson.call(res, data);
      };

      next();
    } catch (error) {
      // Log error but don't fail request
      console.error('Idempotency check failed:', error);
      next();
    }
  }

  /**
   * Check if request path is a payment endpoint
   */
  private isPaymentEndpoint(path: string): boolean {
    const paymentPaths = [
      '/api/payments/process',
      '/api/payments/request-refund',
      '/api/payments/confirm',
      '/api/bills/collect-payment',
    ];
    return paymentPaths.some((p) => path.includes(p));
  }
}
