/**
 * Payment Gateway Interface
 * Defines contract for all payment providers (Sepay, VNPay, Momo, etc.)
 * Allows runtime swapping without changing business logic
 */

export enum PaymentGatewayType {
  SEPAY = 'SEPAY',
  VNPAY = 'VNPAY',
  MOMO = 'MOMO',
}

/**
 * Result of payment verification
 */
export interface PaymentVerificationResult {
  /**
   * Whether payment was found and matches criteria
   */
  success: boolean;

  /**
   * Transaction ID from payment gateway (if found)
   */
  transactionId?: string;

  /**
   * Transaction date from payment gateway
   */
  transactionDate?: Date;

  /**
   * Amount received (if found) - Decimal for precision
   */
  amount?: string | number;

  /**
   * Gateway-specific metadata (bank code, reference, etc.)
   */
  metadata?: Record<string, any>;

  /**
   * Error message if verification failed
   */
  error?: string;
}

/**
 * Transaction from payment gateway
 */
export interface PaymentTransaction {
  id: string;
  amount: string | number; // Decimal for precision
  content: string;
  date: Date;
  bankCode?: string;
  [key: string]: any;
}

/**
 * Options for querying transaction history
 */
export interface TransactionQueryOptions {
  /**
   * Maximum number of transactions to fetch
   */
  limit?: number;

  /**
   * Start date for filtering
   */
  startDate?: Date;

  /**
   * End date for filtering
   */
  endDate?: Date;

  /**
   * Filter by amount
   */
  amount?: number;

  [key: string]: any;
}

/**
 * Main interface that all payment gateways must implement
 * Enables Strategy Pattern for easy provider swapping
 */
export interface IPaymentGateway {
  /**
   * Verify if payment has been received for a contract
   * @param contract Contract with payment details
   * @param expectedAmount Amount to verify (Decimal for precision)
   * @returns Payment verification result with metadata
   */
  verifyPayment(
    contract: any,
    expectedAmount: string | number,
  ): Promise<PaymentVerificationResult>;

  /**
   * Get transaction history from payment gateway
   * @param config Payment config with credentials
   * @param options Query options (limit, date range, etc.)
   * @returns List of transactions
   */
  getTransactionHistory(
    config: any,
    options?: TransactionQueryOptions,
  ): Promise<PaymentTransaction[]>;

  /**
   * Generate payment reference code
   * @param contract Contract to generate ref for
   * @returns Payment reference code (e.g., "HDCONTRACT202501")
   */
  generatePaymentRef(contract: any): string;

  /**
   * Get payment gateway name
   * @returns Gateway type enum
   */
  getName(): PaymentGatewayType;

  /**
   * Validate payment config for this gateway
   * @param config Payment config to validate
   * @throws Error if config is invalid
   */
  validateConfig(config: any): Promise<void>;
}
