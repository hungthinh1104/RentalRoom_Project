import DOMPurify from 'dompurify';
import { securityLogger, SecurityEventType, SecurityEventSeverity } from './security-logger';

/**
 * 🛡️ SECURITY: Sanitize user input to prevent XSS attacks
 * 
 * Use this for any user-generated content that will be rendered as HTML
 * 
 * @param dirty - Untrusted user input
 * @returns Sanitized safe HTML string
 */
export function sanitizeHTML(dirty: string): string {
    if (typeof window === 'undefined') {
        // Server-side: return as-is (will be sanitized on client)
        return dirty;
    }

    // @ts-ignore - DOMPurify types have some incompatibilities
    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
        ALLOWED_ATTR: ['href', 'target', 'rel'],
    });
}

/**
 * Sanitize for plain text display (strips all HTML)
 */
export function sanitizeText(dirty: string): string {
    if (typeof window === 'undefined') return dirty;

    // @ts-ignore - DOMPurify types have some incompatibilities
    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
    });
}

/**
 * Sanitize URLs to prevent XSS and other attacks
 * 
 * @param url - Untrusted URL input
 * @returns Sanitized URL or empty string if invalid
 */
export function sanitizeURL(url: string): string {
    if (!url) return '';

    try {
        const trimmed = url.trim();

        // Block dangerous protocols
        const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:', 'about:'];
        const lowerUrl = trimmed.toLowerCase();

        for (const protocol of dangerousProtocols) {
            if (lowerUrl.startsWith(protocol)) {
                securityLogger.logEvent(
                    SecurityEventType.DANGEROUS_PROTOCOL,
                    `Blocked dangerous URL protocol: ${protocol}`,
                    SecurityEventSeverity.HIGH,
                    { url, protocol }
                );
                return '';
            }
        }

        // Allow only http, https, and relative URLs
        if (!lowerUrl.startsWith('http://') &&
            !lowerUrl.startsWith('https://') &&
            !lowerUrl.startsWith('/')) {
            return '';
        }

        // Use DOMPurify to sanitize
        if (typeof window !== 'undefined') {
            // @ts-ignore
            return DOMPurify.sanitize(trimmed, { ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel|ftp):)/ });
        }

        return trimmed;
    } catch (error) {
        securityLogger.logEvent(
            SecurityEventType.SUSPICIOUS_INPUT,
            'Error sanitizing URL',
            SecurityEventSeverity.MEDIUM,
            { url, error: error instanceof Error ? error.message : 'Unknown error' }
        );
        return '';
    }
}

/**
 * Sanitize filename to prevent path traversal and other attacks
 * 
 * @param filename - Untrusted filename input
 * @returns Sanitized filename
 */
export function sanitizeFilename(filename: string): string {
    if (!filename) return '';

    // Remove path traversal attempts
    let sanitized = filename.replace(/\.\./g, '');

    // Remove path separators
    sanitized = sanitized.replace(/[\/\\]/g, '');

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');

    // Remove control characters
    sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

    // Trim whitespace
    sanitized = sanitized.trim();

    // Limit length
    if (sanitized.length > 255) {
        sanitized = sanitized.substring(0, 255);
    }

    // If empty after sanitization, return a default
    if (!sanitized) {
        return 'unnamed_file';
    }

    return sanitized;
}

/**
 * Escape special characters in search queries to prevent injection
 * 
 * @param query - Search query input
 * @returns Escaped search query
 */
export function escapeSearchQuery(query: string): string {
    if (!query) return '';

    // Escape special regex characters
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Remove SQL injection attempts
    const sqlSafe = escaped.replace(/['";]/g, '');

    // Trim and limit length
    let sanitized = sqlSafe.trim();
    if (sanitized.length > 200) {
        sanitized = sanitized.substring(0, 200);
    }

    return sanitized;
}

/**
 * Sanitize email addresses
 * 
 * @param email - Email input
 * @returns Sanitized email or empty string if invalid
 */
export function sanitizeEmail(email: string): string {
    if (!email) return '';

    const trimmed = email.trim().toLowerCase();

    // Basic email validation regex
    const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

    if (!emailRegex.test(trimmed)) {
        return '';
    }

    // Additional sanitization
    const sanitized = trimmed.replace(/[<>'"]/g, '');

    return sanitized;
}

/**
 * Sanitize phone numbers
 * 
 * @param phone - Phone number input
 * @returns Sanitized phone number (digits only)
 */
export function sanitizePhone(phone: string): string {
    if (!phone) return '';

    // Remove all non-digit characters except + at the start
    let sanitized = phone.trim();

    // Allow + only at the start
    const hasPlus = sanitized.startsWith('+');
    sanitized = sanitized.replace(/\D/g, '');

    if (hasPlus) {
        sanitized = '+' + sanitized;
    }

    return sanitized;
}
