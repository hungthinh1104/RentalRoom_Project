# eKYC Integration Guide (UC_AUTH_01)

## Overview
Users must verify identity via eKYC before registration (UC_AUTH_01).
Supports two government-backed providers: FPT.AI and VNPT.

## Environment Variables

Add to `.env`:

```env
# eKYC Provider (FPT_AI or VNPT)
EKYC_PROVIDER=FPT_AI

# FPT.AI Configuration
# Get API Key from: https://api.fpt.ai/dashboard
EKYC_FPT_API_KEY=your_fpt_ai_api_key_here
EKYC_FPT_ENDPOINT=https://api.fpt.ai/ocr/kyc

# VNPT Configuration (Alternative)
# Get credentials from: https://kycapi.vnpt.vn
EKYC_VNPT_API_KEY=your_vnpt_api_key_here
EKYC_VNPT_CLIENT_ID=your_vnpt_client_id_here
EKYC_VNPT_ENDPOINT=https://kycapi.vnpt.vn/v1
```

## FPT.AI Setup

### 1. Register Account
- Go to https://api.fpt.ai
- Sign up with company email
- Wait for approval (24-48 hours)

### 2. Get API Key
- Dashboard → Settings → API Keys
- Copy API Key
- Add to `EKYC_FPT_API_KEY` in .env

### 3. Test Integration
```bash
curl -X POST https://api.fpt.ai/ocr/kyc/verify \
  -H "api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "front_image": "base64_encoded_image",
    "liveness_video": "base64_encoded_video"
  }'
```

## VNPT Setup (Alternative)

### 1. Register Account
- Contact VNPT KYC team: kycapi@vnpt.vn
- Submit company info + use case
- Sign contract

### 2. Get Credentials
- Receive API Key and Client ID
- Add to `.env`

### 3. Test Integration
```bash
curl -X POST https://kycapi.vnpt.vn/v1/kyc/verify/init \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"client_id": "YOUR_CLIENT_ID"}'
```

## Registration Flow with eKYC

```
User Registration Page
  ↓
User uploads CCCD/CMND (front + back)
  ↓
User records liveness video (3-5 seconds)
  ↓
System calls FPT.AI/VNPT eKYC API
  ↓
✓ Verified → User.ekyc_verified = true
✗ Failed → Error message (retry or manual approval)
  ↓
Complete registration
```

## Database Schema

Add to Prisma `User` model:

```prisma
model User {
  // ... existing fields ...
  
  // eKYC Fields
  ekycVerified Boolean? @default(false)
  ekycVerifiedAt DateTime?
  ekycProvider String? // 'FPT_AI' | 'VNPT'
  ekycVerificationId String? // External verification ID
  ekycRiskLevel String? // 'LOW' | 'MEDIUM' | 'HIGH'
  ekycDocumentNumber String? // CCCD/CMND number (masked)
  
  @@index([ekycVerified])
}
```

## AuthService Integration

In `auth.service.ts`, add eKYC check to registration:

```typescript
async register(dto: RegisterDto) {
  // ... validation ...
  
  // Check eKYC status
  if (!dto.ekycVerified) {
    throw new BadRequestException(
      'eKYC verification required. Complete identity verification before registration.'
    );
  }
  
  // Create user with eKYC fields
  const user = await this.prisma.user.create({
    data: {
      email: dto.email,
      password: await this.hashPassword(dto.password),
      ekycVerified: true,
      ekycVerifiedAt: new Date(),
      ekycProvider: dto.ekycProvider,
      ekycVerificationId: dto.ekycVerificationId,
      ekycRiskLevel: dto.ekycRiskLevel,
    },
  });
  
  return user;
}
```

## Error Handling

### eKYC Rejection Reasons
- Face not matching document → Retry required
- Document not valid/expired → Error
- Liveness check failed → Retry with new video
- Fraud detected (HIGH risk) → Manual admin review required

### Fallback (Manual Approval)
- User submits eKYC application
- Admin manually reviews documents
- Admin approves/rejects with decision email

## Compliance Notes

- eKYC verification valid for 12 months
- Expired verifications require re-verification
- All identity data encrypted in database
- Audit log all verification attempts (Beads JSONL)
- Comply with Vietnamese KYC regulations (Law 47/2013/QH13)

## Implementation Checklist

- [ ] Add eKYC fields to User Prisma model
- [ ] Create migration for eKYC schema changes
- [ ] Implement eKycModule in NestJS (done)
- [ ] Integrate eKycService into AuthService
- [ ] Create eKYC verification endpoint (POST /auth/verify-identity)
- [ ] Add eKYC check to registration endpoint
- [ ] Test both FPT.AI and VNPT providers
- [ ] Add eKYC fields to user DTOs
- [ ] Document in API documentation
- [ ] Configure prod/staging environment variables
