import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';

/**
 * Custom logger service with structured logging
 * Production-ready with Winston
 */
@Injectable()
export class CustomLoggerService implements NestLoggerService {
  private logger: winston.Logger;

  constructor() {
    const isDevelopment = process.env.NODE_ENV !== 'production';

    const transports: winston.transport[] = [
      new winston.transports.Console({
        format: isDevelopment
          ? winston.format.combine(
              winston.format.timestamp(),
              winston.format.colorize(),
              winston.format.printf(
                ({ timestamp, level, message, context, ...meta }) => {
                  const metaStr = Object.keys(meta).length
                    ? JSON.stringify(meta)
                    : '';
                  const ctxStr =
                    typeof context === 'string'
                      ? context
                      : context
                        ? JSON.stringify(context)
                        : 'App';
                  const time = String(timestamp);
                  const lvl = String(level);
                  const msg =
                    typeof message === 'string'
                      ? message
                      : JSON.stringify(message);
                  return `${time} [${ctxStr}] ${lvl}: ${msg} ${metaStr}`;
                },
              ),
            )
          : winston.format.combine(
              winston.format.timestamp(),
              winston.format.json(),
            ),
      }),
    ];

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
      transports,
    });
  }

  log(message: any, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: any, trace?: string, context?: string) {
    this.logger.error(message, { context, trace });
  }

  warn(message: any, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: any, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: any, context?: string) {
    this.logger.verbose(message, { context });
  }

  // Custom methods for structured logging
  logRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    context = 'HTTP',
  ) {
    this.logger.info('Request completed', {
      context,
      method,
      url,
      statusCode,
      duration: `${duration}ms`,
    });
  }

  logError(error: Error, context?: string) {
    this.logger.error(error.message, {
      context,
      stack: error.stack,
      name: error.name,
    });
  }
}
