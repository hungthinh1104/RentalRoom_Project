import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { eKycResult } from '../ekyc.types';
import { IeKycService } from '../ekyc.service.interface';

/**
 * VNPT eKYC Provider
 * Vietnam Post & Telecom's government-backed KYC solution
 *
 * Setup Instructions:
 * 1. Register at https://kycapi.vnpt.vn
 * 2. Get API Key + Client ID from VNPT
 * 3. Add to .env: EKYC_VNPT_API_KEY=xxx, EKYC_VNPT_CLIENT_ID=yyy
 */
@Injectable()
export class VnpteKycProvider implements IeKycService {
  private apiKey: string;
  private clientId: string;
  private endpoint: string;
  private timeout: number = 30000;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get('EKYC_VNPT_API_KEY') || '';
    this.clientId = this.configService.get('EKYC_VNPT_CLIENT_ID') || '';
    this.endpoint = 'https://kycapi.vnpt.vn/v1';

    if (!this.apiKey || !this.clientId) {
      throw new Error(
        'EKYC_VNPT credentials not configured. See docs/SEPAY_CONFIGURATION.md',
      );
    }
  }

  /**
   * Verify identity via VNPT API
   * Uses government CCCD/CMND database
   */
  async verifyIdentity(
    userId: string,
    documentImage: string,
    backImage?: string,
    livenessVideo?: string,
  ): Promise<eKycResult> {
    try {
      // Create verification session
      const sessionResponse = await axios.post(
        `${this.endpoint}/kyc/verify/init`,
        {
          client_id: this.clientId,
          user_id: userId,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: this.timeout,
        },
      );

      const sessionId = sessionResponse.data.session_id;

      // Submit document images
      const documentResponse = await axios.post(
        `${this.endpoint}/kyc/verify/${sessionId}/document`,
        {
          front_image: documentImage,
          back_image: backImage,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: this.timeout,
        },
      );

      // Submit liveness video if provided
      if (livenessVideo) {
        await axios.post(
          `${this.endpoint}/kyc/verify/${sessionId}/liveness`,
          {
            video: livenessVideo,
          },
          {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: this.timeout,
          },
        );
      }

      // Get verification result
      const resultResponse = await axios.get(
        `${this.endpoint}/kyc/verify/${sessionId}/result`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
          timeout: this.timeout,
        },
      );

      if (!resultResponse.data.verified) {
        throw new BadRequestException(resultResponse.data.error_message);
      }

      const data = resultResponse.data;

      return {
        verified: data.verified,
        providerId: 'VNPT',
        verificationId: sessionId,
        documentType: this.mapDocumentType(data.document_type),
        documentNumber: data.document_number,
        fullName: data.full_name,
        dateOfBirth: new Date(data.date_of_birth),
        issuedDate: new Date(data.issued_date),
        expiryDate: new Date(data.expiry_date),
        livenessCheckPassed: data.liveness_verified || false,
        faceMatchScore: data.face_match_score || 0,
        timestamp: new Date(),
        riskLevel: this.calculateRiskLevel(data),
      };
    } catch (error) {
      throw new BadRequestException(
        `VNPT verification failed: ${error.message}`,
      );
    }
  }

  /**
   * Get verification status
   */
  async getVerificationStatus(userId: string): Promise<eKycResult | null> {
    try {
      // Stub: would query VNPT verification history
      // In production, cache result in database
      return null;
    } catch (error) {
      console.error('Failed to get verification status:', error);
      return null;
    }
  }

  /**
   * Revoke KYC verification
   */
  async revokeVerification(userId: string, reason: string): Promise<void> {
    try {
      // Stub: would call VNPT revocation endpoint
      console.log(`Revoking VNPT KYC for user ${userId}: ${reason}`);
    } catch (error) {
      console.error('Failed to revoke verification:', error);
      throw error;
    }
  }

  /**
   * Check if verification is valid
   */
  async isVerificationValid(userId: string): Promise<boolean> {
    // Stub: would check database ekyc_verified_at
    return false;
  }

  /**
   * Map VNPT document type
   */
  private mapDocumentType(vnptType: string): 'CCCD' | 'CMND' | 'PASSPORT' {
    if (vnptType === '01' || vnptType === 'cccd') return 'CCCD';
    if (vnptType === '02' || vnptType === 'cmnd') return 'CMND';
    return 'PASSPORT';
  }

  /**
   * Calculate risk level
   */
  private calculateRiskLevel(data: any): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (!data.verified) return 'HIGH';
    if (!data.government_verified) return 'MEDIUM'; // Not matched with gov DB
    if (data.liveness_verified === false) return 'HIGH';
    if (data.face_match_score < 85) return 'MEDIUM';
    return 'LOW';
  }
}
