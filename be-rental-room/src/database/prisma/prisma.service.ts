import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [{ level: 'query', emit: 'event' }, 'warn', 'error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    const slowMs = parseInt(process.env.PRISMA_SLOW_QUERY_MS || '200', 10);
    // Lightweight slow query logging to identify hot spots
    // Cast to any to satisfy Prisma's conditional typing for event logging
    (this as any).$on('query', (e: Prisma.QueryEvent) => {
      if (typeof e.duration === 'number' && e.duration >= slowMs) {
        this.logger.warn(
          `Slow query (${e.duration} ms): ${e.query} params: ${e.params}`,
        );
      }
    });
  }

  async onModuleInit() {
    const maxAttempts = parseInt(
      process.env.PRISMA_CONNECT_RETRIES || '3',
      10,
    );
    const delayMs = parseInt(
      process.env.PRISMA_CONNECT_RETRY_DELAY_MS || '500',
      10,
    );

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await this.$connect();
        this.logger.log('Prisma connected to database');
        return;
      } catch (err: any) {
        this.logger.warn(
          `Prisma connect attempt ${attempt}/${maxAttempts} failed: ${err?.message || err}`,
        );
        if (attempt === maxAttempts) {
          // Instead of crashing, log warning and allow app to start
          // Routes will fail gracefully when attempting DB operations
          this.logger.error(
            `Failed to connect to database after ${maxAttempts} attempts. App starting without DB connection.`,
          );
          return;
        }
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
