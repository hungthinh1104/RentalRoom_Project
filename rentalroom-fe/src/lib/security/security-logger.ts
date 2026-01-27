/**
 * 🛡️ SECURITY: Security Event Logger
 * 
 * Centralized logging for security-related events
 * Logs to console in development, can be extended to send to monitoring service in production
 */

export enum SecurityEventType {
    // Authentication & Authorization
    RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
    SUSPICIOUS_LOGIN_ATTEMPT = 'SUSPICIOUS_LOGIN_ATTEMPT',
    INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',

    // Redirect & Navigation
    INVALID_REDIRECT = 'INVALID_REDIRECT',
    DANGEROUS_PROTOCOL = 'DANGEROUS_PROTOCOL',

    // Input Validation
    XSS_ATTEMPT = 'XSS_ATTEMPT',
    SQL_INJECTION_ATTEMPT = 'SQL_INJECTION_ATTEMPT',
    PATH_TRAVERSAL_ATTEMPT = 'PATH_TRAVERSAL_ATTEMPT',
    SUSPICIOUS_INPUT = 'SUSPICIOUS_INPUT',

    // CSRF & Request Integrity
    CSRF_FAILURE = 'CSRF_FAILURE',
    INVALID_REQUEST = 'INVALID_REQUEST',

    // Idempotency
    DUPLICATE_REQUEST = 'DUPLICATE_REQUEST',
    IDEMPOTENCY_VIOLATION = 'IDEMPOTENCY_VIOLATION',
}

export enum SecurityEventSeverity {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    CRITICAL = 'CRITICAL',
}

export interface SecurityEvent {
    type: SecurityEventType;
    severity: SecurityEventSeverity;
    message: string;
    context?: Record<string, unknown>;
    timestamp: string;
    userAgent?: string;
    url?: string;
}

class SecurityLogger {
    private events: SecurityEvent[] = [];
    private maxEvents = 100; // Keep last 100 events in memory

    /**
     * Log a security event
     */
    logEvent(
        type: SecurityEventType,
        message: string,
        severity: SecurityEventSeverity = SecurityEventSeverity.MEDIUM,
        context?: Record<string, unknown>
    ): void {
        const event: SecurityEvent = {
            type,
            severity,
            message,
            context,
            timestamp: new Date().toISOString(),
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
            url: typeof window !== 'undefined' ? window.location.href : undefined,
        };

        // Add to in-memory store
        this.events.push(event);
        if (this.events.length > this.maxEvents) {
            this.events.shift(); // Remove oldest event
        }

        // Log to console
        this.logToConsole(event);

        // In production, send to monitoring service
        if (process.env.NODE_ENV === 'production') {
            this.sendToMonitoring(event);
        }
    }

    /**
     * Log to console with appropriate level
     */
    private logToConsole(event: SecurityEvent): void {
        const prefix = `[Security ${event.severity}]`;
        const message = `${prefix} ${event.type}: ${event.message}`;

        switch (event.severity) {
            case SecurityEventSeverity.CRITICAL:
            case SecurityEventSeverity.HIGH:
                console.error(message, event.context);
                break;
            case SecurityEventSeverity.MEDIUM:
                console.warn(message, event.context);
                break;
            case SecurityEventSeverity.LOW:
                console.info(message, event.context);
                break;
        }
    }

    /**
     * Send event to monitoring service (placeholder)
     */
    private async sendToMonitoring(event: SecurityEvent): Promise<void> {
        try {
            // TODO: Implement actual monitoring service integration
            // Example: Send to Sentry, DataDog, or custom endpoint

            // For now, just log that we would send it
            if (event.severity === SecurityEventSeverity.CRITICAL ||
                event.severity === SecurityEventSeverity.HIGH) {
                console.log('[Security] Would send to monitoring:', event.type);
            }

            // Example implementation:
            // await fetch('/api/security/log', {
            //   method: 'POST',
            //   headers: { 'Content-Type': 'application/json' },
            //   body: JSON.stringify(event),
            // });
        } catch (error) {
            console.error('[Security] Failed to send event to monitoring:', error);
        }
    }

    /**
     * Get recent security events
     */
    getRecentEvents(count: number = 10): SecurityEvent[] {
        return this.events.slice(-count);
    }

    /**
     * Get events by type
     */
    getEventsByType(type: SecurityEventType): SecurityEvent[] {
        return this.events.filter(event => event.type === type);
    }

    /**
     * Get events by severity
     */
    getEventsBySeverity(severity: SecurityEventSeverity): SecurityEvent[] {
        return this.events.filter(event => event.severity === severity);
    }

    /**
     * Clear all events
     */
    clearEvents(): void {
        this.events = [];
    }
}

// Export singleton instance
export const securityLogger = new SecurityLogger();

// Convenience functions
export function logRateLimitExceeded(key: string, attemptCount: number): void {
    securityLogger.logEvent(
        SecurityEventType.RATE_LIMIT_EXCEEDED,
        `Rate limit exceeded for key: ${key}`,
        SecurityEventSeverity.MEDIUM,
        { key, attemptCount }
    );
}

export function logInvalidRedirect(url: string, context: string): void {
    securityLogger.logEvent(
        SecurityEventType.INVALID_REDIRECT,
        `Invalid redirect attempt: ${url}`,
        SecurityEventSeverity.HIGH,
        { url, context }
    );
}

export function logXSSAttempt(input: string, location: string): void {
    securityLogger.logEvent(
        SecurityEventType.XSS_ATTEMPT,
        `Potential XSS attempt detected at ${location}`,
        SecurityEventSeverity.HIGH,
        { input: input.substring(0, 100), location } // Truncate input for logging
    );
}

export function logSuspiciousInput(input: string, reason: string): void {
    securityLogger.logEvent(
        SecurityEventType.SUSPICIOUS_INPUT,
        `Suspicious input detected: ${reason}`,
        SecurityEventSeverity.MEDIUM,
        { input: input.substring(0, 100), reason }
    );
}

export function logCSRFFailure(endpoint: string): void {
    securityLogger.logEvent(
        SecurityEventType.CSRF_FAILURE,
        `CSRF token validation failed for endpoint: ${endpoint}`,
        SecurityEventSeverity.CRITICAL,
        { endpoint }
    );
}
