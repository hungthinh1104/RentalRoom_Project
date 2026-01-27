/**
 * Security-related constants and messages
 */

/**
 * Rate limiting messages
 */
export const RATE_LIMIT_MESSAGES = {
    EXCEEDED: (seconds: number) => `Quá nhiều lần thử. Vui lòng đợi ${seconds} giây`,
    WARNING: (count: number, max: number) => `Lần thử ${count}/${max}. Hãy cẩn thận!`,
    LOCKOUT_INFO: 'Đây là biện pháp bảo mật để bảo vệ tài khoản của bạn.',
    SPAM_INFO: 'Đây là biện pháp bảo mật để ngăn chặn spam.',
} as const;

/**
 * Redirect validation messages
 */
export const REDIRECT_MESSAGES = {
    INVALID: 'URL chuyển hướng không hợp lệ',
    BLOCKED_PROTOCOL: (protocol: string) => `Giao thức ${protocol} không được phép`,
    BLOCKED_EXTERNAL: 'Không cho phép chuyển hướng đến trang web bên ngoài',
    NOT_WHITELISTED: 'Đường dẫn không nằm trong danh sách cho phép',
} as const;

/**
 * Input sanitization messages
 */
export const SANITIZATION_MESSAGES = {
    INVALID_URL: 'URL không hợp lệ',
    INVALID_EMAIL: 'Email không hợp lệ',
    INVALID_PHONE: 'Số điện thoại không hợp lệ',
    DANGEROUS_INPUT: 'Đầu vào chứa ký tự nguy hiểm',
} as const;

/**
 * General security messages
 */
export const SECURITY_MESSAGES = {
    CSRF_FAILED: 'Xác thực CSRF thất bại. Vui lòng tải lại trang.',
    SESSION_EXPIRED: 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.',
    UNAUTHORIZED: 'Bạn không có quyền thực hiện hành động này.',
    GENERIC_ERROR: 'Đã xảy ra lỗi. Vui lòng thử lại sau.',
} as const;

/**
 * Security event descriptions (for logging)
 */
export const SECURITY_EVENT_DESCRIPTIONS = {
    RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
    INVALID_REDIRECT: 'Invalid redirect attempt',
    XSS_ATTEMPT: 'Potential XSS attempt detected',
    SQL_INJECTION_ATTEMPT: 'Potential SQL injection attempt detected',
    PATH_TRAVERSAL_ATTEMPT: 'Path traversal attempt detected',
    CSRF_FAILURE: 'CSRF token validation failed',
    SUSPICIOUS_INPUT: 'Suspicious input detected',
} as const;
