import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import {
  IPaymentGateway,
  PaymentGatewayType,
  PaymentVerificationResult,
  PaymentTransaction,
  TransactionQueryOptions,
} from './interfaces';
import { PaymentGatewayFactory } from './factories';

/**
 * Payment Service (Facade)
 * High-level payment operations using payment gateways
 * Abstracts away gateway-specific details from business logic
 *
 * Responsibilities:
 * - Verify payments using configured gateway
 * - Query transaction history
 * - Generate payment references
 * - Handle payment-related errors
 *
 * Benefits:
 * - Easy to swap payment providers (Sepay → VNPay)
 * - Easy to add retry logic, caching, monitoring
 * - No changes needed to ContractsService or other consumers
 *
 * Usage:
 * ```typescript
 * const result = await this.paymentService.verifyPayment(contract, amount);
 * if (result.success) {
 *   // Payment found and matches
 * }
 * ```
 */
@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly gatewayFactory: PaymentGatewayFactory,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Verify payment for a contract
   * Uses appropriate gateway based on landlord configuration
   *
   * @param contract Contract with payment details
   * @param expectedAmount Expected payment amount
   * @returns Verification result with transaction details
   */
  async verifyPayment(
    contract: any,
    expectedAmount: number,
  ): Promise<PaymentVerificationResult> {
    try {
      const gateway = await this.getGatewayForContract(contract);
      this.logger.debug(
        `Using ${gateway.getName()} to verify payment for contract ${contract.id}`,
      );

      const result = await gateway.verifyPayment(contract, expectedAmount);

      if (result.success) {
        this.logger.log(
          `✓ Payment verified for contract ${contract.contractNumber} via ${gateway.getName()}`,
        );
      } else {
        this.logger.debug(
          `✗ Payment not found for contract ${contract.contractNumber}`,
        );
      }

      return result;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Payment verification failed: ${msg}`, error);

      return {
        success: false,
        error: msg,
      };
    }
  }

  /**
   * Get transaction history for a landlord
   *
   * @param landlordId Landlord ID
   * @param options Query options (limit, date range, etc.)
   * @returns List of transactions
   */
  async getTransactionHistory(
    landlordId: string,
    options?: TransactionQueryOptions,
  ): Promise<PaymentTransaction[]> {
    try {
      const config = await this.getPaymentConfig(landlordId);
      if (!config || !config.isActive) {
        this.logger.warn(`No active payment config for landlord ${landlordId}`);
        return [];
      }

      const gateway = await this.gatewayFactory.getForLandlord(landlordId);
      this.logger.debug(
        `Fetching transactions for landlord ${landlordId} via ${gateway.getName()}`,
      );

      return await gateway.getTransactionHistory(config, options);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to fetch transaction history for landlord ${landlordId}: ${msg}`,
      );
      return [];
    }
  }

  /**
   * Generate payment reference code
   * Uses gateway-specific format (e.g., Sepay: HDCONTRACT202501)
   *
   * @param contract Contract to generate reference for
   * @returns Payment reference code
   */
  async generatePaymentRef(contract: any): Promise<string> {
    try {
      const gateway = await this.getGatewayForContract(contract);
      const ref = gateway.generatePaymentRef(contract);
      this.logger.debug(`Generated payment ref: ${ref}`);
      return ref;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to generate payment ref: ${msg}`);
      throw error;
    }
  }

  /**
   * Validate payment configuration for a landlord
   *
   * @param landlordId Landlord ID
   * @throws Error if config is invalid
   */
  async validatePaymentConfig(landlordId: string): Promise<void> {
    try {
      const config = await this.getPaymentConfig(landlordId);
      if (!config) {
        throw new NotFoundException(
          `Payment config not found for landlord ${landlordId}`,
        );
      }

      const gateway = await this.gatewayFactory.getForLandlord(landlordId);
      await gateway.validateConfig(config);
      this.logger.log(`✓ Payment config validated for landlord ${landlordId}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Payment config validation failed: ${msg}`);
      throw error;
    }
  }

  /**
   * Get supported payment gateways
   * Useful for UI/documentation
   *
   * @returns List of supported gateway types
   */
  getSupportedGateways(): PaymentGatewayType[] {
    return this.gatewayFactory.getSupportedGateways();
  }

  /**
   * Check if payment gateway is supported
   *
   * @param type Gateway type to check
   * @returns True if supported
   */
  isGatewaySupported(type: PaymentGatewayType): boolean {
    return this.gatewayFactory.isSupported(type);
  }

  /**
   * Get payment gateway for contract
   * Future: Can be overridden to use different gateways per landlord
   * @private
   */
  private async getGatewayForContract(
    _contract: any,
  ): Promise<IPaymentGateway> {
    // Future: Read from PaymentConfig.gatewayType if multi-gateway support added
    // For now, always use default (Sepay)
    return this.gatewayFactory.getDefault();
  }

  /**
   * Get payment configuration for landlord
   * @private
   */
  private async getPaymentConfig(landlordId: string): Promise<any> {
    return this.prisma.paymentConfig.findUnique({
      where: { landlordId },
    });
  }
}
