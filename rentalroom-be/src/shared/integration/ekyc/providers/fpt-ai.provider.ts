import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { eKycResult } from '../ekyc.types';
import { IeKycService } from '../ekyc.service.interface';

/**
 * FPT.AI eKYC Provider
 * Vietnamese KYC solution with AI-powered document recognition
 *
 * Setup Instructions:
 * 1. Register at https://api.fpt.ai
 * 2. Get API Key from dashboard
 * 3. Add to .env: EKYC_FPT_API_KEY=xxx
 */
@Injectable()
export class FptAieKycProvider implements IeKycService {
  private apiKey: string;
  private endpoint: string;
  private timeout: number = 30000;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get('EKYC_FPT_API_KEY') || '';
    this.endpoint = 'https://api.fpt.ai/ocr/kyc';

    if (!this.apiKey) {
      throw new Error(
        'EKYC_FPT_API_KEY not configured. See docs/SEPAY_CONFIGURATION.md',
      );
    }
  }

  /**
   * Verify identity via FPT.AI API
   * Supports CCCD (Citizen ID), CMND (Old ID), Passport
   */
  async verifyIdentity(
    userId: string,
    documentImage: string,
    backImage?: string,
    livenessVideo?: string,
  ): Promise<eKycResult> {
    try {
      // Call FPT.AI OCR endpoint
      const response = await axios.post(
        `${this.endpoint}/verify`,
        {
          front_image: documentImage,
          back_image: backImage,
          liveness_video: livenessVideo,
          user_id: userId,
        },
        {
          headers: {
            'api-key': this.apiKey,
            'Content-Type': 'application/json',
          },
          timeout: this.timeout,
        },
      );

      if (!response.data.success) {
        throw new BadRequestException(response.data.message);
      }

      // Map FPT.AI response to eKycResult
      const data = response.data.data;

      return {
        verified: data.verified,
        providerId: 'FPT_AI',
        verificationId: data.verification_id,
        documentType: this.mapDocumentType(data.document_type),
        documentNumber: data.document_number,
        fullName: data.full_name,
        dateOfBirth: new Date(data.date_of_birth),
        issuedDate: new Date(data.issued_date),
        expiryDate: new Date(data.expiry_date),
        livenessCheckPassed: data.liveness_passed,
        faceMatchScore: data.face_match_score || 0,
        timestamp: new Date(),
        riskLevel: this.calculateRiskLevel(data),
      };
    } catch (error) {
      throw new BadRequestException(
        `FPT.AI verification failed: ${error.message}`,
      );
    }
  }

  /**
   * Get verification status for user
   */
  async getVerificationStatus(userId: string): Promise<eKycResult | null> {
    try {
      // Stub: would query FPT.AI for verification history
      // In production, cache result in database with ekyc_verified, ekyc_verified_at
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
      // Stub: would call FPT.AI revocation endpoint
      console.log(`Revoking KYC for user ${userId}: ${reason}`);
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
    // Valid if within 12 months
    return false;
  }

  /**
   * Map FPT.AI document type to standard enum
   */
  private mapDocumentType(fptType: string): 'CCCD' | 'CMND' | 'PASSPORT' {
    if (fptType === 'cccd' || fptType === 'citizen_id') return 'CCCD';
    if (fptType === 'cmnd' || fptType === 'old_id') return 'CMND';
    return 'PASSPORT';
  }

  /**
   * Calculate fraud risk level based on FPT.AI confidence scores
   */
  private calculateRiskLevel(data: any): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (!data.verified) return 'HIGH';
    if (!data.liveness_passed) return 'HIGH';
    if (data.face_match_score < 70) return 'MEDIUM';
    if (data.confidence_score < 80) return 'MEDIUM';
    return 'LOW';
  }
}
