# SePay API Configuration Guide

## Environment Variables

Add these variables to your `.env` file:

```env
# Encryption Key (Generate with: openssl rand -hex 32)
ENCRYPTION_KEY=f809f4aab42f73980dd3f0c0811c88558aed799aa6b9d0fb535dc0e01a7ee00c

# SePay API Configuration (Optional - for testing)
# Note: In production, each landlord configures their own SePay credentials via the Payment Config page
SEPAY_API_URL=https://my.sepay.vn/userapi
SEPAY_TEST_TOKEN=your_test_token_here
```

## How SePay Integration Works

### 1. Per-Landlord Configuration
- Each landlord has their own SePay account and API token
- Tokens are stored encrypted in the `PaymentConfig` table
- Format: `{ landlordId, apiToken (encrypted), accountNumber, isActive }`

### 2. Payment Verification Flow
```
1. Contract created → Status: DEPOSIT_PENDING
2. System generates payment reference (e.g., HDABCD202501-0001)
3. Tenant transfers money with reference in description
4. Cron job checks SePay API every 5 minutes
5. If payment found → Contract status: ACTIVE
6. Email sent to tenant confirming activation
```

### 3. API Endpoints

#### Get SePay Transaction History
```http
GET https://my.sepay.vn/userapi/transactions/list
Headers:
  Authorization: Bearer {apiToken}
Query Parameters:
  account_number: {accountNumber}
  limit: 100
```

#### Response Format
```json
{
  "status": 200,
  "messages": {
    "success": true
  },
  "transactions": [
    {
      "id": 123456,
      "transaction_date": "2025-01-15 10:30:00",
      "account_number": "1234567890",
      "transaction_content": "HDABCD202501-0001 Coc phong",
      "transfer_type": "in",
      "transfer_amount": 5000000,
      "accumulated": 10000000,
      "code": "FT25015ABC123",
      "sub_account": "",
      "bank_brand_name": "VCB"
    }
  ]
}
```

### 4. Testing Without Real SePay Account

For development/testing, you can:

1. **Mock the SePay Service**:
   - Create a test endpoint that simulates payment verification
   - Use the `SEPAY_TEST_TOKEN` environment variable

2. **Manual Payment Verification**:
   - Add a `POST /contracts/:id/verify-payment-manual` endpoint (admin only)
   - Allows manual activation for testing

3. **Use SePay Sandbox** (if available):
   - Contact SePay for sandbox credentials
   - Update `SEPAY_API_URL` to sandbox URL

## Security Best Practices

1. **Never commit `.env` file** - Already in `.gitignore`
2. **Rotate encryption keys** periodically
3. **Use different keys** for dev/staging/production
4. **Audit SePay token access** - Log all API calls
5. **Implement rate limiting** on payment verification endpoints

## Troubleshooting

### Payment Not Detected
1. Check `paymentRef` matches transaction content exactly
2. Verify `accountNumber` in `PaymentConfig` is correct
3. Check SePay API token is valid (not expired)
4. Review cron job logs: `docker logs rental-room-api | grep PaymentCron`

### Encryption Errors
1. Ensure `ENCRYPTION_KEY` is exactly 64 hex characters
2. Regenerate key if corrupted: `openssl rand -hex 32`
3. Re-encrypt existing tokens after key change

## Example: Setting Up Landlord Payment Config

```typescript
// POST /api/v1/payments/config
{
  "apiToken": "ABC123XYZ789...",  // Will be encrypted before storage
  "accountNumber": "1234567890",
  "bankName": "Vietcombank",
  "isActive": true
}
```

The system will:
1. Encrypt `apiToken` using `EncryptionService`
2. Store in database
3. Use for payment verification when tenants pay deposits
