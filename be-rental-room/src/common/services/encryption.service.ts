import { Injectable, Logger } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

@Injectable()
export class EncryptionService {
    private readonly logger = new Logger(EncryptionService.name);
    private readonly algorithm = 'aes-256-gcm';
    private readonly key: Buffer;

    constructor() {
        const encryptionKey = process.env.ENCRYPTION_KEY;

        if (!encryptionKey) {
            throw new Error(
                'ENCRYPTION_KEY is not defined in environment variables. ' +
                'Generate one with: openssl rand -hex 32'
            );
        }

        if (encryptionKey.length !== 64) {
            throw new Error(
                'ENCRYPTION_KEY must be 64 hex characters (32 bytes). ' +
                'Current length: ' + encryptionKey.length
            );
        }

        this.key = Buffer.from(encryptionKey, 'hex');
        this.logger.log('EncryptionService initialized successfully');
    }

    /**
     * Encrypt sensitive data (e.g., SePay API tokens)
     * @param text Plain text to encrypt
     * @returns Base64-encoded encrypted data (IV + AuthTag + Ciphertext)
     */
    encrypt(text: string): string {
        try {
            const iv = randomBytes(16); // 128-bit IV for GCM
            const cipher = createCipheriv(this.algorithm, this.key, iv);

            const encrypted = Buffer.concat([
                cipher.update(text, 'utf8'),
                cipher.final(),
            ]);

            const authTag = cipher.getAuthTag();

            // Combine: IV (16) + AuthTag (16) + Encrypted data
            const combined = Buffer.concat([iv, authTag, encrypted]);

            return combined.toString('base64');
        } catch (error) {
            this.logger.error('Encryption failed', error);
            throw new Error('Failed to encrypt data');
        }
    }

    /**
     * Decrypt sensitive data
     * @param encryptedData Base64-encoded encrypted data
     * @returns Decrypted plain text
     */
    decrypt(encryptedData: string): string {
        try {
            const buffer = Buffer.from(encryptedData, 'base64');

            // Extract components
            const iv = buffer.subarray(0, 16);
            const authTag = buffer.subarray(16, 32);
            const encrypted = buffer.subarray(32);

            const decipher = createDecipheriv(this.algorithm, this.key, iv);
            decipher.setAuthTag(authTag);

            const decrypted = Buffer.concat([
                decipher.update(encrypted),
                decipher.final(),
            ]);

            return decrypted.toString('utf8');
        } catch (error) {
            this.logger.error('Decryption failed', error);
            throw new Error('Failed to decrypt data');
        }
    }

    /**
     * Mask sensitive data for display (show only first/last 4 chars)
     * @param text Text to mask
     * @returns Masked text (e.g., "abcd****wxyz")
     */
    mask(text: string): string {
        if (!text || text.length < 8) {
            return '****';
        }

        const start = text.slice(0, 4);
        const end = text.slice(-4);
        const middle = '*'.repeat(Math.min(text.length - 8, 20));

        return `${start}${middle}${end}`;
    }
}
