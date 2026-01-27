import { CacheModuleOptions } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-redis-store';

export const getCacheConfig = (
  configService: ConfigService,
): CacheModuleOptions => {
  const redisTls = configService.get<boolean>('REDIS_TLS', false);

  return {
    store: redisStore,
    host: configService.get<string>('REDIS_HOST', 'localhost'),
    port: configService.get<number>('REDIS_PORT', 6379),
    password: configService.get<string>('REDIS_PASSWORD'), // Upstash password
    ttl: configService.get<number>('REDIS_TTL', 1800), // 30 min default (was 3600)
    max: configService.get<number>('CACHE_MAX_ITEMS', 500), // 500 items (was 100)
    // TLS support for Upstash (production)
    tls: redisTls ? { rejectUnauthorized: false } : undefined,
  };
};

