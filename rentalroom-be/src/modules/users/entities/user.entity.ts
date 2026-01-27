export enum UserRole {
  TENANT = 'TENANT',
  LANDLORD = 'LANDLORD',
  ADMIN = 'ADMIN',
  SYSTEM = 'SYSTEM',
}

export class User {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  phoneNumber: string | null;
  avatarUrl: string | null;
  role: UserRole;
  emailVerified: boolean;
  emailVerificationCode: string | null;
  emailVerificationExpiry: Date | null;
  passwordResetToken: string | null;
  passwordResetExpiry: Date | null;
  lastRefreshTokenFamily: string | null;
  lastRefreshIssuedAt: Date | null;
  isBanned: boolean;
  bannedAt: Date | null;
  bannedReason: string | null;
  bannedBy: string | null;
  ekycVerified: boolean;
  ekycVerifiedAt: Date | null;
  ekycProvider: string | null;
  ekycVerificationId: string | null;
  ekycRiskLevel: string | null;
  ekycDocumentNumber: string | null;
  ekycStatus: string | null;
  ekycData: any;
  createdAt: Date;
  updatedAt: Date;
}
