import { CacheModuleOptions } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-redis-store';

export const getCacheConfig = (
  configService: ConfigService,
): CacheModuleOptions => {
  return {
    store: redisStore,
    host: configService.get<string>('REDIS_HOST', 'localhost'),
    port: configService.get<number>('REDIS_PORT', 6379),
    ttl: configService.get<number>('REDIS_TTL', 3600), // seconds
    max: 100, // maximum number of items in cache
  };
};
