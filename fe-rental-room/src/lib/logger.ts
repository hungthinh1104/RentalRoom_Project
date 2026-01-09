/**
 * Production-safe logger utility for frontend
 * Automatically sanitizes sensitive data in production
 */

type LogLevel = 'log' | 'debug' | 'warn' | 'error';

interface LoggerConfig {
  enableDebug: boolean;
  enableConsole: boolean;
  prefix?: string;
}

const IS_PROD = process.env.NODE_ENV === 'production';
const IS_DEV = process.env.NODE_ENV === 'development';

const defaultConfig: LoggerConfig = {
  enableDebug: IS_DEV,
  enableConsole: true, // Can be disabled via external service
};

// Sensitive keys to mask in logs
const SENSITIVE_KEYS = [
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'apiKey',
  'secret',
  'authorization',
  'cookie',
  'sessionId',
  'creditCard',
  'ssn',
];

export class Logger {
  private config: LoggerConfig;
  private name: string;

  constructor(name: string, config?: Partial<LoggerConfig>) {
    this.name = name;
    this.config = { ...defaultConfig, ...config };
  }

  static create(name: string, config?: Partial<LoggerConfig>): Logger {
    return new Logger(name, config);
  }

  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private formatMessage(level: LogLevel, message: string): string {
    return `[${this.getTimestamp()}] [${level.toUpperCase()}] [${this.name}] ${message}`;
  }

  /**
   * Sanitize sensitive data for production logs
   */
  private sanitize(data: any): any {
    if (!IS_PROD || !data) return data;

    if (typeof data === 'string') {
      // Mask JWT tokens
      if (data.startsWith('eyJ')) {
        return '***' + data.slice(-8);
      }
      return data;
    }

    if (typeof data !== 'object') return data;

    const sanitized: any = Array.isArray(data) ? [] : {};

    for (const key in data) {
      const lowerKey = key.toLowerCase();
      const isSensitive = SENSITIVE_KEYS.some(sk => lowerKey.includes(sk.toLowerCase()));

      if (isSensitive) {
        const value = data[key];
        if (typeof value === 'string' && value.length > 0) {
          sanitized[key] = '***' + value.slice(-4);
        } else {
          sanitized[key] = '***';
        }
      } else if (typeof data[key] === 'object' && data[key] !== null) {
        sanitized[key] = this.sanitize(data[key]);
      } else {
        sanitized[key] = data[key];
      }
    }

    return sanitized;
  }

  log(message: string, data?: any): void {
    if (!this.config.enableConsole) return;
    const formatted = this.formatMessage('log', message);
    const sanitized = this.sanitize(data);
    console.log(formatted, sanitized || '');
  }

  debug(message: string, data?: any): void {
    if (!this.config.enableDebug || !this.config.enableConsole) return;
    const formatted = this.formatMessage('debug', message);
    const sanitized = this.sanitize(data);
    console.debug(formatted, sanitized || '');
  }

  warn(message: string, data?: any): void {
    if (!this.config.enableConsole) return;
    const formatted = this.formatMessage('warn', message);
    const sanitized = this.sanitize(data);
    console.warn(formatted, sanitized || '');
  }

  error(message: string, error?: any): void {
    if (!this.config.enableConsole) return;
    const formatted = this.formatMessage('error', message);
    
    // In production, only log error message and stack, not full object
    let sanitized = error;
    if (IS_PROD && error instanceof Error) {
      sanitized = {
        message: error.message,
        name: error.name,
        stack: IS_DEV ? error.stack : undefined,
      };
    } else {
      sanitized = this.sanitize(error);
    }
    
    console.error(formatted, sanitized || '');
  }

  /**
   * For critical production issues that need immediate attention
   */
  fatal(message: string, error?: any): void {
    const formatted = this.formatMessage('error', `🔴 FATAL: ${message}`);
    const sanitized = this.sanitize(error);
    console.error(formatted, sanitized);
    
    // TODO: Send to external monitoring service (Sentry, LogRocket, etc.)
  }
}
