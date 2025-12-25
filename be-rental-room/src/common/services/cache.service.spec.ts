import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CacheService } from './cache.service';

describe('CacheService', () => {
  let service: CacheService;
  let cacheManager: any;

  beforeEach(async () => {
    const mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      reset: jest.fn(),
      store: {
        keys: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
    cacheManager = module.get(CACHE_MANAGER);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('get', () => {
    it('should get value from cache', async () => {
      const key = 'test-key';
      const value = { data: 'test-data' };
      cacheManager.get.mockResolvedValue(value);

      const result = await service.get(key);

      expect(result).toEqual(value);
      expect(cacheManager.get).toHaveBeenCalledWith(key);
    });

    it('should return undefined if key does not exist', async () => {
      const key = 'non-existent-key';
      cacheManager.get.mockResolvedValue(undefined);

      const result = await service.get(key);

      expect(result).toBeUndefined();
      expect(cacheManager.get).toHaveBeenCalledWith(key);
    });

    it('should get typed value from cache', async () => {
      const key = 'user-123';
      const user = { id: '123', name: 'Test User' };
      cacheManager.get.mockResolvedValue(user);

      const result = await service.get<typeof user>(key);

      expect(result).toEqual(user);
      expect(result?.id).toBe('123');
    });
  });

  describe('set', () => {
    it('should set value to cache without TTL', async () => {
      const key = 'test-key';
      const value = { data: 'test-data' };
      cacheManager.set.mockResolvedValue(undefined);

      await service.set(key, value);

      expect(cacheManager.set).toHaveBeenCalledWith(key, value, undefined);
    });

    it('should set value to cache with TTL', async () => {
      const key = 'test-key';
      const value = { data: 'test-data' };
      const ttl = 3600; // 1 hour
      cacheManager.set.mockResolvedValue(undefined);

      await service.set(key, value, ttl);

      expect(cacheManager.set).toHaveBeenCalledWith(key, value, ttl);
    });

    it('should set string value to cache', async () => {
      const key = 'string-key';
      const value = 'simple string';
      cacheManager.set.mockResolvedValue(undefined);

      await service.set(key, value);

      expect(cacheManager.set).toHaveBeenCalledWith(key, value, undefined);
    });

    it('should set number value to cache', async () => {
      const key = 'number-key';
      const value = 12345;
      cacheManager.set.mockResolvedValue(undefined);

      await service.set(key, value, 60);

      expect(cacheManager.set).toHaveBeenCalledWith(key, value, 60);
    });
  });

  describe('del', () => {
    it('should delete specific key from cache', async () => {
      const key = 'test-key';
      cacheManager.del.mockResolvedValue(undefined);

      await service.del(key);

      expect(cacheManager.del).toHaveBeenCalledWith(key);
    });

    it('should handle deletion of non-existent key', async () => {
      const key = 'non-existent-key';
      cacheManager.del.mockResolvedValue(undefined);

      await service.del(key);

      expect(cacheManager.del).toHaveBeenCalledWith(key);
    });
  });

  describe('reset', () => {
    it('should clear all cache', async () => {
      cacheManager.reset.mockResolvedValue(undefined);

      await service.reset();

      expect(cacheManager.reset).toHaveBeenCalled();
    });

    it('should handle cache manager without reset method', async () => {
      const cacheManagerWithoutReset = {
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
        store: { keys: jest.fn() },
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          CacheService,
          {
            provide: CACHE_MANAGER,
            useValue: cacheManagerWithoutReset,
          },
        ],
      }).compile();

      const serviceWithoutReset = module.get<CacheService>(CacheService);

      await serviceWithoutReset.reset();

      expect(cacheManagerWithoutReset.get).not.toHaveBeenCalled();
    });
  });

  describe('deleteByPattern', () => {
    it('should delete all keys matching pattern', async () => {
      const pattern = 'rooms:*';
      const matchingKeys = ['rooms:1', 'rooms:2', 'rooms:3'];
      cacheManager.store.keys.mockResolvedValue(matchingKeys);
      cacheManager.del.mockResolvedValue(undefined);

      await service.deleteByPattern(pattern);

      expect(cacheManager.store.keys).toHaveBeenCalledWith(pattern);
      expect(cacheManager.del).toHaveBeenCalledTimes(3);
      expect(cacheManager.del).toHaveBeenCalledWith('rooms:1');
      expect(cacheManager.del).toHaveBeenCalledWith('rooms:2');
      expect(cacheManager.del).toHaveBeenCalledWith('rooms:3');
    });

    it('should handle empty result when no keys match pattern', async () => {
      const pattern = 'nonexistent:*';
      cacheManager.store.keys.mockResolvedValue([]);
      cacheManager.del.mockResolvedValue(undefined);

      await service.deleteByPattern(pattern);

      expect(cacheManager.store.keys).toHaveBeenCalledWith(pattern);
      expect(cacheManager.del).not.toHaveBeenCalled();
    });

    it('should handle cache store without keys method', async () => {
      const cacheManagerWithoutKeys = {
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
        reset: jest.fn(),
        store: {},
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          CacheService,
          {
            provide: CACHE_MANAGER,
            useValue: cacheManagerWithoutKeys,
          },
        ],
      }).compile();

      const serviceWithoutKeys = module.get<CacheService>(CacheService);

      await serviceWithoutKeys.deleteByPattern('test:*');

      expect(cacheManagerWithoutKeys.del).not.toHaveBeenCalled();
    });
  });

  describe('invalidateRoomCache', () => {
    it('should invalidate specific room cache', async () => {
      const roomId = 'room-123';
      cacheManager.store.keys.mockResolvedValue([]);
      cacheManager.del.mockResolvedValue(undefined);

      await service.invalidateRoomCache(roomId);

      expect(cacheManager.store.keys).toHaveBeenCalledWith(`*rooms/${roomId}*`);
      expect(cacheManager.store.keys).toHaveBeenCalledWith('*rooms?*');
      expect(cacheManager.store.keys).toHaveBeenCalledWith('*rooms*');
    });

    it('should invalidate all rooms cache when no roomId provided', async () => {
      cacheManager.store.keys.mockResolvedValue([]);
      cacheManager.del.mockResolvedValue(undefined);

      await service.invalidateRoomCache();

      expect(cacheManager.store.keys).toHaveBeenCalledWith('*rooms?*');
      expect(cacheManager.store.keys).toHaveBeenCalledWith('*rooms*');
      expect(cacheManager.store.keys).not.toHaveBeenCalledWith(
        expect.stringContaining('rooms/'),
      );
    });

    it('should delete all matching room cache keys', async () => {
      const roomId = 'room-123';
      const matchingKeys = ['cache:rooms/room-123', 'rooms?page=1'];
      cacheManager.store.keys
        .mockResolvedValueOnce(['cache:rooms/room-123'])
        .mockResolvedValueOnce(['rooms?page=1'])
        .mockResolvedValueOnce([]);
      cacheManager.del.mockResolvedValue(undefined);

      await service.invalidateRoomCache(roomId);

      expect(cacheManager.del).toHaveBeenCalledWith('cache:rooms/room-123');
      expect(cacheManager.del).toHaveBeenCalledWith('rooms?page=1');
    });
  });

  describe('invalidatePropertyCache', () => {
    it('should invalidate specific property cache', async () => {
      const propertyId = 'property-456';
      cacheManager.store.keys.mockResolvedValue([]);
      cacheManager.del.mockResolvedValue(undefined);

      await service.invalidatePropertyCache(propertyId);

      expect(cacheManager.store.keys).toHaveBeenCalledWith(
        `*properties/${propertyId}*`,
      );
      expect(cacheManager.store.keys).toHaveBeenCalledWith('*properties?*');
      expect(cacheManager.store.keys).toHaveBeenCalledWith('*properties*');
    });

    it('should invalidate all properties cache when no propertyId provided', async () => {
      cacheManager.store.keys.mockResolvedValue([]);
      cacheManager.del.mockResolvedValue(undefined);

      await service.invalidatePropertyCache();

      expect(cacheManager.store.keys).toHaveBeenCalledWith('*properties?*');
      expect(cacheManager.store.keys).toHaveBeenCalledWith('*properties*');
      expect(cacheManager.store.keys).not.toHaveBeenCalledWith(
        expect.stringContaining('properties/'),
      );
    });

    it('should delete all matching property cache keys', async () => {
      const propertyId = 'property-456';
      const matchingKeys = [
        'cache:properties/property-456',
        'properties?status=ACTIVE',
      ];
      cacheManager.store.keys
        .mockResolvedValueOnce(['cache:properties/property-456'])
        .mockResolvedValueOnce(['properties?status=ACTIVE'])
        .mockResolvedValueOnce([]);
      cacheManager.del.mockResolvedValue(undefined);

      await service.invalidatePropertyCache(propertyId);

      expect(cacheManager.del).toHaveBeenCalledWith(
        'cache:properties/property-456',
      );
      expect(cacheManager.del).toHaveBeenCalledWith('properties?status=ACTIVE');
    });
  });

  describe('invalidateImageCache', () => {
    it('should invalidate specific image cache', async () => {
      const imageId = 'image-789';
      cacheManager.store.keys.mockResolvedValue([]);
      cacheManager.del.mockResolvedValue(undefined);

      await service.invalidateImageCache(imageId);

      expect(cacheManager.store.keys).toHaveBeenCalledWith(
        `*images/${imageId}*`,
      );
      expect(cacheManager.store.keys).toHaveBeenCalledWith('*images*');
    });

    it('should invalidate all images cache when no imageId provided', async () => {
      cacheManager.store.keys.mockResolvedValue([]);
      cacheManager.del.mockResolvedValue(undefined);

      await service.invalidateImageCache();

      expect(cacheManager.store.keys).toHaveBeenCalledWith('*images*');
      expect(cacheManager.store.keys).not.toHaveBeenCalledWith(
        expect.stringContaining('images/'),
      );
    });

    it('should delete all matching image cache keys', async () => {
      const imageId = 'image-789';
      cacheManager.store.keys
        .mockResolvedValueOnce(['cache:images/image-789'])
        .mockResolvedValueOnce(['images:list']);
      cacheManager.del.mockResolvedValue(undefined);

      await service.invalidateImageCache(imageId);

      expect(cacheManager.del).toHaveBeenCalledWith('cache:images/image-789');
      expect(cacheManager.del).toHaveBeenCalledWith('images:list');
    });
  });
});
