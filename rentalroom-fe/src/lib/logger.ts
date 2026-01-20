/**
 * Production-safe logger utility for frontend
 * Automatically sanitizes sensitive data in production
 */

type LogLevel = 'log' | 'debug' | 'warn' | 'error';

interface LoggerConfig {
  enableDebug: boolean;
  enableConsole: boolean;
  prefix?: string;
  remoteLogger?: RemoteLogger;
}

export interface RemoteLogger {
  captureException(error: unknown, context?: Record<string, unknown>): void;
  captureMessage(message: string, context?: Record<string, unknown>): void;
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
  private sanitize(data: unknown): unknown {
    if (!IS_PROD || data === undefined || data === null) return data;

    if (typeof data === 'string') {
      // Mask JWT tokens
      if (data.startsWith('eyJ')) {
        return '***' + data.slice(-8);
      }
      return data;
    }

    if (typeof data !== 'object' || data === null) return data;

    const sanitized: Record<string, unknown> | unknown[] = Array.isArray(data) ? [] : {};

    for (const key in data as Record<string, unknown>) {
      const lowerKey = key.toLowerCase();
      const isSensitive = SENSITIVE_KEYS.some(sk => lowerKey.includes(sk.toLowerCase()));

      const value = (data as Record<string, unknown>)[key];

      if (isSensitive) {
        if (typeof value === 'string' && value.length > 0) {
          (sanitized as Record<string, unknown>)[key] = '***' + value.slice(-4);
        } else {
          (sanitized as Record<string, unknown>)[key] = '***';
        }
      } else if (typeof value === 'object' && value !== null) {
        (sanitized as Record<string, unknown>)[key] = this.sanitize(value);
      } else {
        (sanitized as Record<string, unknown>)[key] = value;
      }
    }

    return sanitized;
  }

  log(message: string, data?: unknown): void {
    if (!this.config.enableConsole) return;
    const formatted = this.formatMessage('log', message);
    const sanitized = this.sanitize(data);
    console.log(formatted, sanitized || '');
  }

  debug(message: string, data?: unknown): void {
    if (!this.config.enableDebug || !this.config.enableConsole) return;
    const formatted = this.formatMessage('debug', message);
    const sanitized = this.sanitize(data);
    console.debug(formatted, sanitized || '');
  }

  warn(message: string, data?: unknown): void {
    if (!this.config.enableConsole) return;
    const formatted = this.formatMessage('warn', message);
    const sanitized = this.sanitize(data);
    console.warn(formatted, sanitized || '');
  }

  error(message: string, error?: unknown): void {
    if (!this.config.enableConsole) return;
    const formatted = this.formatMessage('error', message);

    // In production, only log error message and stack, not full object
    let sanitized: unknown = error;
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
  fatal(message: string, error?: unknown): void {
    const formatted = this.formatMessage('error', `🔴 FATAL: ${message}`);
    const sanitized = this.sanitize(error);
    console.error(formatted, sanitized);

    // Send to external monitoring service if configured
    if (this.config.remoteLogger) {
      this.config.remoteLogger.captureException(error, {
        message,
        timestamp: this.getTimestamp(),
        level: 'fatal',
        logger: this.name,
      });
    }
  }
}
