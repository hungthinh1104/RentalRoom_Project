import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { PaymentVerificationResult } from './interfaces';

@Injectable()
export class SepayService {
  private readonly logger = new Logger(SepayService.name);
  private readonly baseUrl = 'https://my.sepay.vn/userapi';

  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Verify payment for a specific contract
   */
  async verifyPayment(
    contract: any,
    expectedAmount: number,
  ): Promise<PaymentVerificationResult> {
    try {
      // Get API token from environment
      const apiToken = process.env.SEPAY_API_TOKEN;
      if (!apiToken) {
        this.logger.error('SEPAY_API_TOKEN not configured in environment');
        return { success: false, error: 'Payment verification not configured' };
      }

      // Get Landlord Payment Config (for bank details)
      const landlordId = contract.landlordId;
      const config = await this.prisma.paymentConfig.findUnique({
        where: { landlordId },
      });

      if (!config || !config.isActive) {
        this.logger.warn(`No active payment config for landlord ${landlordId}`);
        return { success: false, error: 'Payment config missing' };
      }

      // 2. Call SePay API
      const paymentRef = contract.paymentRef;
      if (!paymentRef) {
        this.logger.warn(`Contract ${contract.id} has no paymentRef`);
        return { success: false, error: 'Contract has no payment ref' };
      }

      // API: /transactions/list?limit=50
      const url = `${this.baseUrl}/transactions/list`;
      const response = await lastValueFrom(
        this.httpService.get(url, {
          headers: {
            Authorization: `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
          },
          params: {
            limit: 50, // Check recent 50 transactions
          },
        }),
      );

      const transactions = response.data.transactions;
      if (!transactions || transactions.length === 0) {
        return { success: false, error: 'No transactions found' };
      }

      // 3. Find matching transaction
      const normalizedRef = paymentRef
        .replace(/[^a-zA-Z0-9]/g, '')
        .toUpperCase();

      const validTransaction = transactions.find((trans: any) => {
        const amountIn = parseFloat(trans.amount_in);
        const content = trans.transaction_content || '';

        const normalizedContent = content
          .replace(/[^a-zA-Z0-9]/g, '')
          .toUpperCase();

        // Check if content contains paymentRef (normalized)
        const isContentMatch = normalizedContent.includes(normalizedRef);

        // Check amount (allow small difference? No, precise match or greater)
        const isAmountMatch = amountIn >= expectedAmount;

        this.logger.debug(
          `Checking trans: ${content} (${amountIn}) vs Ref: ${paymentRef} (${expectedAmount}) -> Match: ${isContentMatch && isAmountMatch}`,
        );

        return isContentMatch && isAmountMatch;
      });

      if (validTransaction) {
        this.logger.log(
          `Payment verify success for ${paymentRef}. TransID: ${validTransaction.id}`,
        );
        return {
          success: true,
          transactionId: validTransaction.id,
          amount: parseFloat(validTransaction.amount_in),
          transactionDate: new Date(validTransaction.transaction_date),
          metadata: validTransaction,
        };
      }

      return {
        success: false,
        error: 'Payment not found in recent transactions',
      };
    } catch (error) {
      this.logger.error(
        `SePay verify error for contract ${contract.id}`,
        error,
      );
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate QR code for invoice payment
   * Returns URL to SePay QR code image
   */
  async generateQR(
    landlordId: string,
    amount: number,
    paymentRef: string,
    description?: string,
  ): Promise<{ success: boolean; qrUrl?: string; error?: string }> {
    try {
      // Get landlord's payment config for bank details
      // @ts-ignore
      const config = await this.prisma.paymentConfig.findUnique({
        where: { landlordId },
      });

      if (!config || !config.isActive) {
        this.logger.warn(`No active payment config for landlord ${landlordId}`);
        return { success: false, error: 'Payment config missing' };
      }

      // SePay QR generation endpoint
      // Format: https://qr.sepay.vn/img?bank=BANK_CODE&acc=ACCOUNT&amount=AMOUNT&des=DESCRIPTION
      const bankCode = config.bankName || 'MB'; // Use bank name from config
      const accountNumber = config.accountNumber;
      const desc = description || paymentRef;

      const qrUrl = `https://qr.sepay.vn/img?bank=${encodeURIComponent(bankCode)}&acc=${encodeURIComponent(accountNumber)}&amount=${Math.round(amount)}&des=${encodeURIComponent(desc)}`;

      this.logger.log(
        `Generated QR for landlord ${landlordId}, ref: ${paymentRef}`,
      );

      return {
        success: true,
        qrUrl,
      };
    } catch (error) {
      this.logger.error(
        `SePay QR generation error for landlord ${landlordId}`,
        error,
      );
      return { success: false, error: error.message };
    }
  }
}
