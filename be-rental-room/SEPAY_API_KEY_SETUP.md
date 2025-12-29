  # SePay API Key Setup Guide

  ## Quick Start - Add to .env file

  Copy these lines to your `.env` file in the backend directory:

  ```env
  # Encryption Key for SePay tokens (REQUIRED)
  # Generate with: openssl rand -hex 32
  ENCRYPTION_KEY=f809f4aab42f73980dd3f0c0811c88558aed799aa6b9d0fb535dc0e01a7ee00c

  # SePay API Configuration (OPTIONAL - for testing only)
  SEPAY_API_URL=https://my.sepay.vn/userapi
  SEPAY_TEST_TOKEN=your_sepay_api_token_here
  SEPAY_TEST_ACCOUNT_NUMBER=your_bank_account_number
  ```

  ## How to Get Your SePay API Token

  ### Method 1: From SePay Dashboard
  1. Login to https://my.sepay.vn
  2. Go to **Settings** → **API Management**
  3. Click **Generate New Token** or copy existing token
  4. Copy the token (format: `SEPAYABCXYZ123...`)

  ### Method 2: Contact SePay Support
  - Email: support@sepay.vn
  - Request API access for your account
  - Provide your business information

  ## Environment Variables Explained

  ### ENCRYPTION_KEY (REQUIRED)
  - **Purpose**: Encrypts SePay API tokens before storing in database
  - **Format**: 64 hex characters (32 bytes)
  - **Generate**: `openssl rand -hex 32`
  - **Security**: NEVER commit this to git, use different keys for dev/staging/prod

  ### SEPAY_API_URL
  - **Purpose**: Base URL for SePay API
  - **Production**: `https://my.sepay.vn/userapi`
  - **Sandbox**: Contact SePay for sandbox URL (if available)

  ### SEPAY_TEST_TOKEN (Optional)
  - **Purpose**: For testing payment verification without real transactions
  - **Format**: Long alphanumeric string from SePay
  - **Note**: Only needed for development/testing

  ### SEPAY_TEST_ACCOUNT_NUMBER (Optional)
  - **Purpose**: Bank account number linked to test token
  - **Format**: 10-14 digit number
  - **Note**: Must match the account in SePay dashboard

  ## Production Setup

  In production, **DO NOT** use environment variables for SePay tokens. Instead:

  1. Each landlord configures their own SePay credentials via the UI
  2. Tokens are encrypted using `EncryptionService`
  3. Stored in `PaymentConfig` table per landlord
  4. Decrypted only when verifying payments

  ## Complete .env Template

  ```env
  # Database
  DATABASE_URL="postgresql://postgres:password@postgres:5432/rental_room_db?schema=public"

  # JWT
  JWT_SECRET="your-super-secret-jwt-key"
  JWT_EXPIRES_IN="7d"

  # Email (Nodemailer)
  MAIL_HOST="smtp.gmail.com"
  MAIL_PORT=587
  MAIL_USER="your-email@gmail.com"
  MAIL_PASSWORD="your-app-password"
  MAIL_FROM="Rental Room <noreply@rentalroom.com>"

  # Application
  NODE_ENV="development"
  PORT=3001
  FRONTEND_URL="http://localhost:3000"

  # Encryption (REQUIRED)
  ENCRYPTION_KEY="f809f4aab42f73980dd3f0c0811c88558aed799aa6b9d0fb535dc0e01a7ee00c"

  # SePay (OPTIONAL - for testing)
  SEPAY_API_URL="https://my.sepay.vn/userapi"
  SEPAY_TEST_TOKEN="your_token_here"
  SEPAY_TEST_ACCOUNT_NUMBER="1234567890"

  # File Upload
  MAX_FILE_SIZE=5242880
  UPLOAD_DIR="./uploads"

  # Logging
  LOG_LEVEL="debug"
  ```

  ## Testing Without Real SePay Account

  If you don't have a SePay account yet:

  1. **Skip SePay Integration**: Comment out payment verification in cron job
  2. **Manual Activation**: Add admin endpoint to manually activate contracts
  3. **Mock Service**: Create a mock SePay service for testing

  Example mock service:
  ```typescript
  // src/modules/payments/sepay-mock.service.ts
  @Injectable()
  export class SepayMockService {
    async verifyPayment(contract: any, expectedAmount: number): Promise<boolean> {
      // Always return true for testing
      console.log(`[MOCK] Payment verified for contract ${contract.contractNumber}`);
      return true;
    }
  }
  ```

  ## Security Checklist

  - [ ] `ENCRYPTION_KEY` is 64 hex characters
  - [ ] `.env` file is in `.gitignore`
  - [ ] Different keys for dev/staging/production
  - [ ] SePay tokens are encrypted before database storage
  - [ ] API tokens are never logged or exposed in responses
  - [ ] Regular key rotation schedule established

  ## Troubleshooting

  ### "ENCRYPTION_KEY is not defined"
  - Check `.env` file exists in backend root
  - Verify key is exactly 64 hex characters
  - Restart backend after adding key

  ### "Invalid SePay token"
  - Verify token is copied correctly (no spaces)
  - Check token hasn't expired
  - Confirm account number matches SePay dashboard

  ### "Payment not detected"
  - Verify `paymentRef` matches transaction description exactly
  - Check account number in `PaymentConfig`
  - Review SePay API response in logs
