import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    const maxAttempts = parseInt(
      process.env.PRISMA_CONNECT_RETRIES || '10',
      10,
    );
    const delayMs = parseInt(
      process.env.PRISMA_CONNECT_RETRY_DELAY_MS || '2000',
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
        if (attempt === maxAttempts) throw err;
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
