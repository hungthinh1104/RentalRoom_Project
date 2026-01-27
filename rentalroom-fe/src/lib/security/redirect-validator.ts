/**
 * 🛡️ SECURITY: Redirect Validation
 * 
 * Prevents open redirect vulnerabilities by validating redirect URLs
 * against a whitelist of allowed paths.
 */

import { logInvalidRedirect, securityLogger, SecurityEventType, SecurityEventSeverity } from './security-logger';

/**
 * Whitelist of allowed redirect paths
 * Only these paths are allowed for post-login redirects
 */
const ALLOWED_REDIRECT_PATHS = [
    '/',
    '/dashboard',
    '/contracts',
    '/properties',
    '/utilities',
    '/maintenance',
    '/disputes',
    '/profile',
    '/settings',
    '/applications',
    '/invoices',
    '/tax',
    '/admin',
    '/admin/users',
    '/admin/disputes',
    '/admin/properties',
] as const;

/**
 * Dangerous protocols that should never be allowed
 */
const DANGEROUS_PROTOCOLS = [
    'javascript:',
    'data:',
    'vbscript:',
    'file:',
    'about:',
] as const;

/**
 * Check if a URL is safe for redirection
 */
export function isValidRedirect(url: string | null | undefined): boolean {
    if (!url) return false;

    try {
        // Normalize the URL
        const normalized = url.trim().toLowerCase();

        // Block dangerous protocols
        for (const protocol of DANGEROUS_PROTOCOLS) {
            if (normalized.startsWith(protocol)) {
                securityLogger.logEvent(
                    SecurityEventType.DANGEROUS_PROTOCOL,
                    `Blocked dangerous protocol: ${protocol}`,
                    SecurityEventSeverity.HIGH,
                    { url, protocol }
                );
                return false;
            }
        }

        // Block absolute URLs (external redirects)
        if (normalized.startsWith('http://') || normalized.startsWith('https://') || normalized.startsWith('//')) {
            securityLogger.logEvent(
                SecurityEventType.INVALID_REDIRECT,
                'Blocked external redirect attempt',
                SecurityEventSeverity.HIGH,
                { url }
            );
            return false;
        }

        // Ensure it starts with /
        if (!normalized.startsWith('/')) {
            return false;
        }

        // Extract the base path (before query params and hash)
        const basePath = normalized.split('?')[0].split('#')[0];

        // Check if the base path is in the whitelist or starts with an allowed path
        const isAllowed = ALLOWED_REDIRECT_PATHS.some(allowedPath => {
            return basePath === allowedPath || basePath.startsWith(allowedPath + '/');
        });

        if (!isAllowed) {
            securityLogger.logEvent(
                SecurityEventType.INVALID_REDIRECT,
                `Redirect path not in whitelist: ${basePath}`,
                SecurityEventSeverity.MEDIUM,
                { url, basePath }
            );
        }

        return isAllowed;
    } catch (error) {
        securityLogger.logEvent(
            SecurityEventType.INVALID_REDIRECT,
            'Error validating redirect',
            SecurityEventSeverity.MEDIUM,
            { url, error: error instanceof Error ? error.message : 'Unknown error' }
        );
        return false;
    }
}

/**
 * Sanitize and validate a redirect URL
 * Returns a safe redirect path or the default fallback
 */
export function sanitizeRedirect(
    url: string | null | undefined,
    fallback: string = '/dashboard'
): string {
    if (!url) return fallback;

    // Validate the URL
    if (!isValidRedirect(url)) {
        // Logging already done in isValidRedirect
        return fallback;
    }

    // Remove any leading/trailing whitespace
    let sanitized = url.trim();

    // Ensure it starts with /
    if (!sanitized.startsWith('/')) {
        sanitized = '/' + sanitized;
    }

    // Remove any double slashes (except after protocol)
    sanitized = sanitized.replace(/([^:]\/)\/+/g, '$1');

    // Decode any encoded characters to prevent bypass attempts
    try {
        sanitized = decodeURIComponent(sanitized);
    } catch (e) {
        console.warn('[Security] Failed to decode redirect URL, using original');
    }

    // Final validation after sanitization
    if (!isValidRedirect(sanitized)) {
        return fallback;
    }

    return sanitized;
}

/**
 * Get a safe redirect URL from query parameters
 */
export function getSafeRedirectFromQuery(
    searchParams: URLSearchParams | null,
    paramName: string = 'redirect',
    fallback: string = '/dashboard'
): string {
    if (!searchParams) return fallback;

    const redirect = searchParams.get(paramName);
    return sanitizeRedirect(redirect, fallback);
}

/**
 * Validate redirect and log suspicious attempts
 */
export function validateAndLogRedirect(
    url: string | null | undefined,
    context: string = 'unknown'
): boolean {
    const isValid = isValidRedirect(url);

    if (!isValid && url) {
        // 🛡️ SECURITY: Log suspicious redirect attempt
        logInvalidRedirect(url, context);
    }

    return isValid;
}
