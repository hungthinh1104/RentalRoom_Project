import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | undefined> {
    return await this.cacheManager.get<T>(key);
  }

  /**
   * Set value to cache
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  /**
   * Delete specific key from cache
   */
  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  /**
   * Clear all cache
   */
  async reset(): Promise<void> {
    const cacheManager = this.cacheManager as any;
    if (cacheManager.reset) {
      await cacheManager.reset();
    }
  }

  /**
   * Delete cache by pattern (for Redis)
   * Example: deleteByPattern('rooms:*')
   */
  async deleteByPattern(pattern: string): Promise<void> {
    const cacheManager = this.cacheManager as any;
    const store = cacheManager.store;
    if (store && store.keys) {
      const keys = await store.keys(pattern);
      if (keys && keys.length > 0) {
        await Promise.all(
          keys.map((key: string) => this.cacheManager.del(key)),
        );
      }
    }
  }

  /**
   * Invalidate room cache when room is updated/deleted
   */
  async invalidateRoomCache(roomId?: string): Promise<void> {
    if (roomId) {
      // Delete specific room cache
      await this.deleteByPattern(`*rooms/${roomId}*`);
    }
    // Delete all rooms list cache
    await this.deleteByPattern('*rooms?*');
    await this.deleteByPattern('*rooms*');
  }

  /**
   * Invalidate property cache when property is updated/deleted
   */
  async invalidatePropertyCache(propertyId?: string): Promise<void> {
    if (propertyId) {
      // Delete specific property cache
      await this.deleteByPattern(`*properties/${propertyId}*`);
    }
    // Delete all properties list cache
    await this.deleteByPattern('*properties?*');
    await this.deleteByPattern('*properties*');
  }

  /**
   * Invalidate image cache
   */
  async invalidateImageCache(imageId?: string): Promise<void> {
    if (imageId) {
      await this.deleteByPattern(`*images/${imageId}*`);
    }
    await this.deleteByPattern('*images*');
  }
}
