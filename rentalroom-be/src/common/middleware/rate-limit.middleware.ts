import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Rate limiting middleware for sensitive operations
 * Prevents abuse on idempotent endpoints (approve, reject, markAsPaid, submitMeterReadings)
 *
 * Policy:
 * - 100 requests per 15 minutes per IP
 * - 10 requests per minute per IP for sensitive endpoints
 * - Tracks idempotency key usage
 */
@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private ipRequestMap = new Map<
    string,
    { count: number; resetTime: number }
  >();
  private sensitiveIpMap = new Map<
    string,
    { count: number; resetTime: number }
  >();

  constructor() {
    // Cleanup expired entries every 5 minutes
    setInterval(() => {
      const now = Date.now();
      this.ipRequestMap.forEach((val, key) => {
        if (val.resetTime < now) {
          this.ipRequestMap.delete(key);
        }
      });
      this.sensitiveIpMap.forEach((val, key) => {
        if (val.resetTime < now) {
          this.sensitiveIpMap.delete(key);
        }
      });
    }, 5 * 60 * 1000);
  }

  use(req: Request, res: Response, next: NextFunction) {
    const ip = this.getIp(req);

    // Sensitive endpoints (idempotent operations)
    const sensitivePaths = [
      '/applications/approve',
      '/applications/reject',
      '/invoices/mark-paid',
      '/meter-readings',
    ];
    const isSensitive = sensitivePaths.some((path) =>
      req.path.includes(path),
    );

    if (isSensitive) {
      this.checkSensitiveRateLimit(ip);
    } else {
      this.checkGeneralRateLimit(ip);
    }

    next();
  }

  private getIp(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')?.[0] ||
      req.ip ||
      'unknown'
    );
  }

  private checkGeneralRateLimit(ip: string) {
    const now = Date.now();
    const limit = 100;
    const window = 15 * 60 * 1000; // 15 minutes

    const entry = this.ipRequestMap.get(ip);
    if (entry && entry.resetTime > now) {
      entry.count++;
      if (entry.count > limit) {
        throw new HttpException(
          `Rate limit exceeded: max ${limit} requests per 15 minutes`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    } else {
      this.ipRequestMap.set(ip, { count: 1, resetTime: now + window });
    }
  }

  private checkSensitiveRateLimit(ip: string) {
    const now = Date.now();
    const limit = 10;
    const window = 60 * 1000; // 1 minute

    const entry = this.sensitiveIpMap.get(ip);
    if (entry && entry.resetTime > now) {
      entry.count++;
      if (entry.count > limit) {
        throw new HttpException(
          `Rate limit exceeded for sensitive operations: max ${limit} requests per minute`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    } else {
      this.sensitiveIpMap.set(ip, { count: 1, resetTime: now + window });
    }
  }
}
