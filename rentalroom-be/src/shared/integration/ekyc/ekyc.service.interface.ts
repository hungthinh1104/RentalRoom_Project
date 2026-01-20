import { eKycResult, eKycProvider } from './ekyc.types';

/**
 * eKYC Service Interface
 * Abstraction for multiple KYC providers (FPT.AI, VNPT)
 */
export interface IeKycService {
  /**
   * Verify user identity via document upload + liveness check
   * @param userId User ID performing verification
   * @param documentImage CCCD/CMND front image (base64)
   * @param backImage Optional back image for CCCD
   * @param livenessVideo Video selfie for face matching
   * @returns eKYC result with verification status
   */
  verifyIdentity(
    userId: string,
    documentImage: string,
    backImage?: string,
    livenessVideo?: string,
  ): Promise<eKycResult>;

  /**
   * Get KYC verification status for user
   */
  getVerificationStatus(userId: string): Promise<eKycResult | null>;

  /**
   * Revoke KYC verification (e.g., on account suspension)
   */
  revokeVerification(userId: string, reason: string): Promise<void>;

  /**
   * Check if verification is still valid
   * @returns true if verified within last 12 months
   */
  isVerificationValid(userId: string): Promise<boolean>;
}
