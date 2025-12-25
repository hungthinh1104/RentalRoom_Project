import { Reflector } from '@nestjs/core';
import {
  CacheKey,
  CacheTTL,
  CACHE_KEY_METADATA,
  CACHE_TTL_METADATA,
} from './cache.decorator';

describe('Cache Decorators', () => {
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
  });

  describe('CacheKey', () => {
    it('should set cache key metadata', () => {
      @CacheKey('test-key')
      class TestController {}

      const cacheKey = reflector.get(CACHE_KEY_METADATA, TestController);
      expect(cacheKey).toBe('test-key');
    });

    it('should set cache key metadata on method', () => {
      class TestController {
        @CacheKey('method-key')
        testMethod() {}
      }

      const cacheKey = reflector.get(
        CACHE_KEY_METADATA,
        TestController.prototype.testMethod,
      );
      expect(cacheKey).toBe('method-key');
    });

    it('should work with different cache keys', () => {
      @CacheKey('users')
      class UsersController {}

      @CacheKey('rooms')
      class RoomsController {}

      const usersKey = reflector.get(CACHE_KEY_METADATA, UsersController);
      const roomsKey = reflector.get(CACHE_KEY_METADATA, RoomsController);

      expect(usersKey).toBe('users');
      expect(roomsKey).toBe('rooms');
    });

    it('should export CACHE_KEY_METADATA constant', () => {
      expect(CACHE_KEY_METADATA).toBe('cache_key_metadata');
    });
  });

  describe('CacheTTL', () => {
    it('should set cache TTL metadata', () => {
      @CacheTTL(3600)
      class TestController {}

      const cacheTtl = reflector.get(CACHE_TTL_METADATA, TestController);
      expect(cacheTtl).toBe(3600);
    });

    it('should set cache TTL metadata on method', () => {
      class TestController {
        @CacheTTL(1800)
        testMethod() {}
      }

      const cacheTtl = reflector.get(
        CACHE_TTL_METADATA,
        TestController.prototype.testMethod,
      );
      expect(cacheTtl).toBe(1800);
    });

    it('should work with different TTL values', () => {
      @CacheTTL(60)
      class ShortCacheController {}

      @CacheTTL(86400)
      class LongCacheController {}

      const shortTtl = reflector.get(CACHE_TTL_METADATA, ShortCacheController);
      const longTtl = reflector.get(CACHE_TTL_METADATA, LongCacheController);

      expect(shortTtl).toBe(60);
      expect(longTtl).toBe(86400);
    });

    it('should work with zero TTL', () => {
      @CacheTTL(0)
      class NoTtlController {}

      const ttl = reflector.get(CACHE_TTL_METADATA, NoTtlController);
      expect(ttl).toBe(0);
    });

    it('should export CACHE_TTL_METADATA constant', () => {
      expect(CACHE_TTL_METADATA).toBe('cache_ttl_metadata');
    });
  });

  describe('Combined usage', () => {
    it('should work with both decorators on same class', () => {
      @CacheKey('combined')
      @CacheTTL(7200)
      class CombinedController {}

      const cacheKey = reflector.get(CACHE_KEY_METADATA, CombinedController);
      const cacheTtl = reflector.get(CACHE_TTL_METADATA, CombinedController);

      expect(cacheKey).toBe('combined');
      expect(cacheTtl).toBe(7200);
    });

    it('should work with both decorators on same method', () => {
      class TestController {
        @CacheKey('method-combined')
        @CacheTTL(3600)
        testMethod() {}
      }

      const cacheKey = reflector.get(
        CACHE_KEY_METADATA,
        TestController.prototype.testMethod,
      );
      const cacheTtl = reflector.get(
        CACHE_TTL_METADATA,
        TestController.prototype.testMethod,
      );

      expect(cacheKey).toBe('method-combined');
      expect(cacheTtl).toBe(3600);
    });
  });
});
