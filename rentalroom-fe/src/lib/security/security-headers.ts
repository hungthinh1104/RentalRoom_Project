/**
 * 🛡️ SECURITY: Security Headers Configuration
 * 
 * Defines security headers to be added to all responses
 * Includes Content Security Policy, X-Frame-Options, and other security headers
 */

export const securityHeaders = [
    // Content Security Policy
    {
        key: 'Content-Security-Policy',
        value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // unsafe-inline needed for Next.js, unsafe-eval for dev
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "img-src 'self' data: https: blob:",
            "font-src 'self' data: https://fonts.gstatic.com",
            "connect-src 'self' " + (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'),
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
        ].join('; '),
    },
    // Prevent clickjacking
    {
        key: 'X-Frame-Options',
        value: 'DENY',
    },
    // Prevent MIME type sniffing
    {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
    },
    // Referrer policy
    {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
    },
    // Permissions policy (formerly Feature-Policy)
    {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
    },
    // XSS Protection (legacy, but still useful for older browsers)
    {
        key: 'X-XSS-Protection',
        value: '1; mode=block',
    },
    // Strict Transport Security (HTTPS only)
    // Only enable in production with HTTPS
    ...(process.env.NODE_ENV === 'production'
        ? [
            {
                key: 'Strict-Transport-Security',
                value: 'max-age=63072000; includeSubDomains; preload',
            },
        ]
        : []),
];

/**
 * CSP Report-Only mode for testing
 * Use this during development/testing to see violations without blocking
 */
export const securityHeadersReportOnly = [
    {
        key: 'Content-Security-Policy-Report-Only',
        value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "img-src 'self' data: https: blob:",
            "font-src 'self' data: https://fonts.gstatic.com",
            "connect-src 'self' " + (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'),
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "report-uri /api/csp-report", // Optional: endpoint to receive CSP violation reports
        ].join('; '),
    },
];
