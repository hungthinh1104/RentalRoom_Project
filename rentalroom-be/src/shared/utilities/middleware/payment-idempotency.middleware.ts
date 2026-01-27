import {
  Injectable,
  NestMiddleware,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../../database/prisma/prisma.service';

@Injectable()
export class PaymentIdempotencyMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Only apply to POST/PUT/PATCH methods that create/update resources
    if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
      return next();
    }

    const idempotencyKey = req.headers['idempotency-key'] as string;

    // Optional: Only strictly enforce for specific payment routes or make it global
    // For now, we enforce if the header is present
    if (!idempotencyKey) {
      // If it's a critical payment endpoint, we might require it.
      // For general usage, we just skip if not provided.
      return next();
    }

    try {
      // Check if key exists
      const existingRecord = await this.prisma.idempotencyRecord.findUnique({
        where: { key: idempotencyKey },
      });

      if (existingRecord) {
        // Check expiry
        if (new Date() > existingRecord.expiresAt) {
          // Expired keys are logically treated as simple duplicates or errors?
          // Usually expiry means we can reuse? No, idempotency keys should be unique per operation.
          // If expired, it likely means the client is reusing a very old key or retrying too late.
          throw new BadRequestException('Idempotency key has expired.');
        }

        // Return cached result immediately
        // We return 409 Conflict or the original status?
        // True idempotency returns the ORIGINAL response.
        // Assuming resultData contains { statusCode, body }
        const result = existingRecord.resultData as any;

        if (result && result.statusCode && result.body) {
          return res.status(result.statusCode).json(result.body);
        }

        // Fallback if records exist but no result (processing?)
        throw new ConflictException(
          'Request with this Idempotency-Key is already processing.',
        );
      }

      // If not exists, we attach the key to the request for the Interceptor to handle saving later?
      // OR we strictly handle it here?
      // Middleware is usually for checking. Saving the result happens AFTER the handler.
      // So we generally need an INTERCEPTOR for Idempotency to save the response.
      // But the Requirement said "Middleware".
      // Middleware usually blocks duplicates.
      // We'll trust the Interceptor to save the record.
      // We verify here.

      // Attach key to request for controller/interceptor usage
      (req as any).idempotencyKey = idempotencyKey;

      next();
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error('Idempotency error:', error);
      next(error);
    }
  }
}
