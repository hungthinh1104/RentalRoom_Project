/**
 * 🛡️ SECURITY: Rate Limiter with Exponential Backoff
 * 
 * Prevents brute force attacks by limiting request frequency
 * and implementing exponential backoff after failed attempts.
 */

import { logRateLimitExceeded, SecurityEventSeverity, securityLogger, SecurityEventType } from './security-logger';

export interface RateLimitConfig {
    maxAttempts: number;
    baseBackoffMs: number;
    maxBackoffMs: number;
    resetAfterMs: number;
}

interface AttemptRecord {
    count: number;
    firstAttempt: number;
    lastAttempt: number;
    lockedUntil?: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
    maxAttempts: 5,
    baseBackoffMs: 1000, // 1 second
    maxBackoffMs: 30000, // 30 seconds
    resetAfterMs: 300000, // 5 minutes
};

export class RateLimiter {
    private attempts: Map<string, AttemptRecord> = new Map();
    private config: RateLimitConfig;

    constructor(config: Partial<RateLimitConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };

        // Clean up old records periodically
        if (typeof window !== 'undefined') {
            setInterval(() => this.cleanup(), 60000); // Every minute
        }
    }

    /**
     * Check if an action is allowed for the given key
     */
    isAllowed(key: string): boolean {
        const now = Date.now();
        const record = this.attempts.get(key);

        if (!record) {
            return true; // First attempt
        }

        // Check if locked out
        if (record.lockedUntil && now < record.lockedUntil) {
            return false;
        }

        // Check if should reset (after reset period)
        if (now - record.lastAttempt > this.config.resetAfterMs) {
            this.attempts.delete(key);
            return true;
        }

        // Check if max attempts exceeded
        if (record.count >= this.config.maxAttempts) {
            return false;
        }

        return true;
    }

    /**
     * Record a failed attempt
     */
    recordAttempt(key: string): void {
        const now = Date.now();
        const record = this.attempts.get(key);

        if (!record) {
            this.attempts.set(key, {
                count: 1,
                firstAttempt: now,
                lastAttempt: now,
            });
            return;
        }

        // Increment attempt count
        record.count += 1;
        record.lastAttempt = now;

        // Calculate lockout if max attempts exceeded
        if (record.count >= this.config.maxAttempts) {
            const backoffTime = this.calculateBackoff(record.count);
            record.lockedUntil = now + backoffTime;

            // 🛡️ SECURITY: Log rate limit exceeded
            logRateLimitExceeded(key, record.count);
        }

        this.attempts.set(key, record);
    }

    /**
     * Reset attempts for a key (call on successful action)
     */
    reset(key: string): void {
        this.attempts.delete(key);
    }

    /**
     * Get remaining backoff time in milliseconds
     */
    getBackoffTime(key: string): number {
        const now = Date.now();
        const record = this.attempts.get(key);

        if (!record || !record.lockedUntil) {
            return 0;
        }

        const remaining = record.lockedUntil - now;
        return Math.max(0, remaining);
    }

    /**
     * Get remaining backoff time in seconds (for UI display)
     */
    getBackoffSeconds(key: string): number {
        return Math.ceil(this.getBackoffTime(key) / 1000);
    }

    /**
     * Get attempt count for a key
     */
    getAttemptCount(key: string): number {
        return this.attempts.get(key)?.count || 0;
    }

    /**
     * Calculate exponential backoff time
     */
    private calculateBackoff(attemptCount: number): number {
        const exponent = attemptCount - this.config.maxAttempts;
        const backoff = this.config.baseBackoffMs * Math.pow(2, exponent);
        return Math.min(backoff, this.config.maxBackoffMs);
    }

    /**
     * Clean up old records
     */
    private cleanup(): void {
        const now = Date.now();
        const keysToDelete: string[] = [];

        this.attempts.forEach((record, key) => {
            // Remove if last attempt was more than reset period ago
            if (now - record.lastAttempt > this.config.resetAfterMs) {
                keysToDelete.push(key);
            }
        });

        keysToDelete.forEach(key => this.attempts.delete(key));
    }
}

/**
 * Request throttling - prevents duplicate requests within a time window
 */
const pendingRequests = new Map<string, Promise<any>>();

export async function throttleRequest<T>(
    fn: () => Promise<T>,
    key: string,
    minIntervalMs: number = 1000
): Promise<T> {
    // Check if there's a pending request
    const pending = pendingRequests.get(key);
    if (pending) {
        return pending as Promise<T>;
    }

    // Execute the request
    const promise = fn();
    pendingRequests.set(key, promise);

    try {
        const result = await promise;

        // Clear after minimum interval
        setTimeout(() => {
            pendingRequests.delete(key);
        }, minIntervalMs);

        return result;
    } catch (error) {
        // Clear immediately on error
        pendingRequests.delete(key);
        throw error;
    }
}

/**
 * Global rate limiter instances
 */
export const authRateLimiter = new RateLimiter({
    maxAttempts: 5,
    baseBackoffMs: 1000,
    maxBackoffMs: 30000,
    resetAfterMs: 300000,
});

export const apiRateLimiter = new RateLimiter({
    maxAttempts: 10,
    baseBackoffMs: 500,
    maxBackoffMs: 10000,
    resetAfterMs: 60000,
});
