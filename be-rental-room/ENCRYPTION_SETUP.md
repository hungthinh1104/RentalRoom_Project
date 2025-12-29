# Encryption Setup Guide

## Generate Encryption Key

Run this command to generate a secure 256-bit encryption key:

```bash
openssl rand -hex 32
```

## Add to Environment Variables

Add the generated key to your `.env` file:

```env
# Encryption key for sensitive data (SePay API tokens, etc.)
# Generated with: openssl rand -hex 32
ENCRYPTION_KEY=f809f4aab42f73980dd3f0c0811c88558aed799aa6b9d0fb535dc0e01a7ee00c
```

## Security Notes

1. **Never commit** the encryption key to version control
2. **Use different keys** for development, staging, and production
3. **Rotate keys** periodically (requires re-encrypting existing data)
4. **Backup keys** securely (losing the key means losing access to encrypted data)

## Usage

The `EncryptionService` is automatically available in services that import `CommonModule`:

```typescript
constructor(private readonly encryptionService: EncryptionService) {}

// Encrypt sensitive data before saving
const encrypted = this.encryptionService.encrypt(apiToken);
await this.prisma.paymentConfig.create({
  data: { apiToken: encrypted }
});

// Decrypt when needed
const decrypted = this.encryptionService.decrypt(config.apiToken);
```
