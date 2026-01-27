import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { PrismaService } from 'src/database/prisma/prisma.service';
import {
  IPaymentGateway,
  PaymentGatewayType,
  PaymentVerificationResult,
  PaymentTransaction,
  TransactionQueryOptions,
} from '../interfaces';

/**
 * Sepay Payment Gateway Adapter
 * Implements IPaymentGateway interface for Sepay bank transfer service
 * Handles payment verification via Sepay API
 *
 * Features:
 * - Verify bank transfers to landlord accounts
 * - Fetch transaction history
 * - Generate payment references
 * - Support for multiple landlord accounts
 */
@Injectable()
export class SepayAdapter implements IPaymentGateway {
  private readonly logger = new Logger(SepayAdapter.name);
  private readonly baseUrl = 'https://my.sepay.vn/userapi';

  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Verify payment for a contract
   * Queries Sepay API to find matching transaction
   */
  async verifyPayment(
    contract: any,
    expectedAmount: number,
  ): Promise<PaymentVerificationResult> {
    try {
      // Get API token from environment
      const apiToken = process.env.SEPAY_API_TOKEN;
      if (!apiToken) {
        this.logger.error('SEPAY_API_TOKEN not configured');
        return {
          success: false,
          error: 'Payment verification not configured',
        };
      }

      // Get Landlord Payment Config
      const landlordId = contract.landlordId;
      const config = await this.prisma.paymentConfig.findUnique({
        where: { landlordId },
      });

      if (!config || !config.isActive) {
        this.logger.warn(`No active Sepay config for landlord ${landlordId}`);
        return {
          success: false,
          error: 'Payment config not found',
        };
      }

      // 2. Get payment reference
      const paymentRef = contract.paymentRef;
      if (!paymentRef) {
        this.logger.warn(`Contract ${contract.id} has no paymentRef`);
        return {
          success: false,
          error: 'Payment reference not set',
        };
      }

      // 3. Fetch transactions from Sepay
      const transactions = await this.fetchTransactions({
        ...config,
        apiToken,
      });
      if (!transactions || transactions.length === 0) {
        return {
          success: false,
          error: 'No transactions found',
        };
      }

      // 4. Find matching transaction
      const normalizedRef = paymentRef
        .replace(/[^a-zA-Z0-9]/g, '')
        .toUpperCase();

      const validTransaction = transactions.find((trans: any) => {
        const amountIn = parseFloat(trans.amount_in);
        const content = trans.transaction_content || '';

        const normalizedContent = content
          .replace(/[^a-zA-Z0-9]/g, '')
          .toUpperCase();

        // Match by reference and amount
        const isContentMatch = normalizedContent.includes(normalizedRef);
        const isAmountMatch = amountIn >= expectedAmount;

        this.logger.debug(
          `Sepay verify: Content="${content}" (${amountIn}VND) vs Ref="${paymentRef}" (${expectedAmount}VND) -> Match: ${isContentMatch && isAmountMatch}`,
        );

        return isContentMatch && isAmountMatch;
      });

      if (validTransaction) {
        this.logger.log(
          `✓ Sepay payment verified for ${paymentRef}. TransID: ${validTransaction.id}`,
        );
        return {
          success: true,
          transactionId: validTransaction.id,
          transactionDate: new Date(validTransaction.transaction_date),
          amount: parseFloat(validTransaction.amount_in),
          metadata: {
            bankCode: validTransaction.bank_brand_name,
            accountNumber: validTransaction.account_number,
            fullContent: validTransaction.transaction_content,
          },
        };
      }

      return {
        success: false,
        error: 'Matching transaction not found',
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Sepay verification error: ${msg}`, error);
      return {
        success: false,
        error: msg,
      };
    }
  }

  /**
   * Get transaction history from Sepay
   */
  async getTransactionHistory(
    config: any,
    options?: TransactionQueryOptions,
  ): Promise<PaymentTransaction[]> {
    try {
      const transactions = await this.fetchTransactions(config, options);
      return transactions.map((trans: any) => ({
        id: trans.id,
        amount: parseFloat(trans.amount_in),
        content: trans.transaction_content,
        date: new Date(trans.transaction_date),
        bankCode: trans.bank_brand_name,
      }));
    } catch (error) {
      this.logger.error('Failed to fetch Sepay transaction history', error);
      return [];
    }
  }

  /**
   * Generate payment reference code for Sepay
   * Format: HD + CONTRACT_NUMBER (alphanumeric only)
   */
  generatePaymentRef(contract: any): string {
    return `HD${contract.contractNumber || contract.id}`
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
      .slice(0, 20); // Limit length
  }

  /**
   * Get gateway name
   */
  getName(): PaymentGatewayType {
    return PaymentGatewayType.SEPAY;
  }

  /**
   * Validate Sepay config
   */
  validateConfig(config: any): Promise<void> {
    if (!config.accountNumber) {
      throw new BadRequestException('Sepay account number is required');
    }

    if (!config.bankName) {
      throw new BadRequestException('Sepay bank name is required');
    }

    // Token is from environment, just validate config fields
    this.logger.debug('✓ Sepay config validated successfully');
    return Promise.resolve();
  }

  /**
   * Fetch transactions from Sepay API
   * @private
   */
  private async fetchTransactions(
    config: any,
    options?: TransactionQueryOptions,
  ): Promise<any[]> {
    const url = `${this.baseUrl}/transactions/list`;
    const limit = options?.limit || 50;

    try {
      const response = await lastValueFrom(
        this.httpService.get(url, {
          headers: {
            Authorization: `Bearer ${config.apiToken}`,
            'Content-Type': 'application/json',
          },
          params: {
            limit,
          },
        }),
      );

      return response.data.transactions || [];
    } catch (error) {
      this.logger.error('Sepay API call failed', error);
      throw error;
    }
  }
}
