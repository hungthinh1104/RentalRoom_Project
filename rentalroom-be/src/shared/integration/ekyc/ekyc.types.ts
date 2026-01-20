import { IeKycService } from './ekyc.service.interface';

/**
 * eKYC Integration Types
 * UC_AUTH_01: Identity verification via FPT.AI or VNPT
 */

export interface eKycResult {
  verified: boolean;
  providerId: string;
  verificationId: string;
  documentType: 'CCCD' | 'CMND' | 'PASSPORT'; // CCCD: Citizen ID, CMND: Old ID
  documentNumber: string;
  fullName: string;
  dateOfBirth: Date;
  issuedDate: Date;
  expiryDate: Date;
  livenessCheckPassed: boolean;
  faceMatchScore: number; // 0-100
  timestamp: Date;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'; // Fraud detection risk
}

export interface eKycProvider {
  name: string;
  apiKey: string;
  endpoint: string;
  timeout: number;
}

export enum eKycProviderType {
  FPT_AI = 'FPT_AI',
  VNPT = 'VNPT',
}

export type { IeKycService };
