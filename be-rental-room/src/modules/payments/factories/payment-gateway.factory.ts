import { Injectable, Logger } from '@nestjs/common';
import { IPaymentGateway, PaymentGatewayType } from '../interfaces';
import { SepayAdapter } from '../adapters';
// import { VNPayAdapter } from '../adapters/vnpay.adapter'; // Future
// import { MomoAdapter } from '../adapters/momo.adapter'; // Future

/**
 * Payment Gateway Factory
 * Creates and manages payment gateway instances
 * Enables easy switching between providers without code changes
 *
 * Usage:
 * ```typescript
 * const gateway = this.factory.create(PaymentGatewayType.SEPAY);
 * const result = await gateway.verifyPayment(contract, amount);
 * ```
 *
 * Future: Can select gateway based on:
 * - Landlord preference from DB
 * - Country/region
 * - Payment method
 */
@Injectable()
export class PaymentGatewayFactory {
  private readonly logger = new Logger(PaymentGatewayFactory.name);

  constructor(
    private readonly sepayAdapter: SepayAdapter,
    // private readonly vnpayAdapter: VNPayAdapter, // Future
    // private readonly momoAdapter: MomoAdapter, // Future
  ) {}

  /**
   * Create payment gateway instance by type
   * @param type Gateway type (SEPAY, VNPAY, MOMO)
   * @returns Payment gateway instance
   * @throws Error if type is not supported
   */
  create(type: PaymentGatewayType): IPaymentGateway {
    switch (type) {
      case PaymentGatewayType.SEPAY:
        return this.sepayAdapter;

      // Future support for other providers
      // case PaymentGatewayType.VNPAY:
      //   return this.vnpayAdapter;
      // case PaymentGatewayType.MOMO:
      //   return this.momoAdapter;

      default:
        throw new Error(`Unsupported payment gateway: ${type}`);
    }
  }

  /**
   * Get default payment gateway
   * Currently returns Sepay (only supported provider)
   * @returns Default gateway instance
   */
  getDefault(): IPaymentGateway {
    this.logger.debug('Using default payment gateway: SEPAY');
    return this.sepayAdapter;
  }

  /**
   * Get payment gateway for landlord
   * Future: Will read landlord preference from DB
   * Currently always returns Sepay
   *
   * @param landlordId Landlord ID
   * @returns Gateway instance for landlord
   */
  async getForLandlord(landlordId: string): Promise<IPaymentGateway> {
    // TODO: Query PaymentConfig.gatewayType from DB when multi-gateway support added
    // const config = await this.prisma.paymentConfig.findUnique({
    //   where: { landlordId },
    // });
    // return this.create(config?.gatewayType || PaymentGatewayType.SEPAY);

    // For now, always use Sepay
    return this.getDefault();
  }

  /**
   * Get all supported gateway types
   * @returns Array of supported types
   */
  getSupportedGateways(): PaymentGatewayType[] {
    return [
      PaymentGatewayType.SEPAY,
      // PaymentGatewayType.VNPAY, // Future
      // PaymentGatewayType.MOMO, // Future
    ];
  }

  /**
   * Check if gateway type is supported
   * @param type Gateway type to check
   * @returns True if supported
   */
  isSupported(type: PaymentGatewayType): boolean {
    return this.getSupportedGateways().includes(type);
  }
}
