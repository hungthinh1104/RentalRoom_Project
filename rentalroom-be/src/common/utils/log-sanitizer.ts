/**
 * Log Sanitizer Utility
 * CRITICAL: Use this to sanitize ALL logs containing user/system data
 *
 * Prevents sensitive information leakage in application logs
 */

export class LogSanitizer {
  private static readonly SENSITIVE_KEYS = [
    'password',
    'passwordHash',
    'apiToken',
    'refreshToken',
    'accessToken',
    'secret',
    'secretKey',
    'privateKey',
    'bankAccount',
    'citizenId',
    'ssn',
    'creditCard',
    'cvv',
  ];

  /**
   * Sanitize object for logging
   * Recursively replaces sensitive values with '***REDACTED***'
   */
  static sanitize(obj: any): any {
    if (obj === null || obj === undefined) return obj;

    if (typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitize(item));
    }

    const sanitized: any = {};

    for (const key in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;

      const lowerKey = key.toLowerCase();
      const isSensitive = this.SENSITIVE_KEYS.some((sensitiveKey) =>
        lowerKey.includes(sensitiveKey.toLowerCase()),
      );

      if (isSensitive) {
        sanitized[key] = '***REDACTED***';
      } else if (typeof obj[key] === 'object') {
        sanitized[key] = this.sanitize(obj[key]); // Recursive
      } else {
        sanitized[key] = obj[key];
      }
    }

    return sanitized;
  }

  /**
   * Safe logger wrapper
   * Use this instead of logger.log() when logging user/system data
   */
  static log(logger: any, message: string, data?: any) {
    if (data) {
      logger.log(message, this.sanitize(data));
    } else {
      logger.log(message);
    }
  }

  /**
   * Safe error logger
   */
  static error(logger: any, message: string, error?: any, data?: any) {
    if (data) {
      logger.error(message, error, this.sanitize(data));
    } else {
      logger.error(message, error);
    }
  }

  /**
   * Safe warn logger
   */
  static warn(logger: any, message: string, data?: any) {
    if (data) {
      logger.warn(message, this.sanitize(data));
    } else {
      logger.warn(message);
    }
  }

  /**
   * Safe debug logger
   */
  static debug(logger: any, message: string, data?: any) {
    if (data) {
      logger.debug(message, this.sanitize(data));
    } else {
      logger.debug(message);
    }
  }
}
