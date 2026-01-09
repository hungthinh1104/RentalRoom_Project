import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CacheService } from '../../common/services/cache.service';
import { UserRole } from '@prisma/client';

import { UploadService } from '../upload/upload.service';
import { TestDataFactory } from '../../../test/utils/test-data.factory';
import { RoomStatus } from './entities/room.entity';

describe('RoomsService', () => {
  let service: RoomsService;
  let prisma: PrismaService;
  let cacheService: CacheService;

  const mockAdminUser = {
    id: 'admin-user-1',
    role: UserRole.ADMIN,
  };

  const mockPrismaService = {
    room: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    roomReview: {
      groupBy: jest.fn().mockResolvedValue([]),
    },
  };

  const mockCacheService = {
    invalidateRoomCache: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  const mockUploadService = {
    deleteFileByUrl: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
        {
          provide: UploadService,
          useValue: mockUploadService,
        },
      ],
    }).compile();

    service = module.get<RoomsService>(RoomsService);
    prisma = module.get<PrismaService>(PrismaService);
    cacheService = module.get<CacheService>(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new room with property relation', async () => {
      const createDto = {
        propertyId: 'property-123',
        roomNumber: 'R101',
        area: 25,
        pricePerMonth: 5000000,
        deposit: 2000000,
        status: RoomStatus.AVAILABLE,
      };

      const mockRoom = {
        ...TestDataFactory.createRoom(createDto),
        property: {
          id: 'property-123',
          name: 'Test Property',
          address: '123 Test St',
          city: 'Test City',
          ward: 'Test Ward',
        },
      };
      mockPrismaService.room.create.mockResolvedValue(mockRoom);

      const result = await service.create(createDto as any);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('roomNumber', 'R101');
      expect(mockPrismaService.room.create).toHaveBeenCalledWith({
        data: {
          ...createDto,
          images: { create: undefined },
          amenities: { create: undefined },
        },
        include: {
          property: true,
          images: true,
          amenities: true,
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated rooms', async () => {
      const filterDto = { page: 1, limit: 10, skip: 0 };
      const mockRooms = [
        {
          ...TestDataFactory.createRoom(),
          property: {
            id: 'property-1',
            name: 'Property 1',
            address: '123 St',
            city: 'City 1',
            ward: 'Ward 1',
          },
        },
        {
          ...TestDataFactory.createRoom(),
          property: {
            id: 'property-2',
            name: 'Property 2',
            address: '456 St',
            city: 'City 2',
            ward: 'Ward 2',
          },
        },
      ];

      mockPrismaService.room.findMany.mockResolvedValue(mockRooms);
      mockPrismaService.room.count.mockResolvedValue(2);

      const result = await service.findAll(filterDto as any);

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
      expect(mockPrismaService.room.findMany).toHaveBeenCalled();
    });

    it('should filter by status', async () => {
      const filterDto = {
        page: 1,
        limit: 10,
        skip: 0,
        status: RoomStatus.AVAILABLE,
      };
      const mockRooms = [
        {
          ...TestDataFactory.createRoom({ status: 'AVAILABLE' as const }),
          property: {
            id: 'property-1',
            name: 'Property 1',
            address: '123 St',
            city: 'City 1',
            ward: 'Ward 1',
          },
        },
      ];

      mockPrismaService.room.findMany.mockResolvedValue(mockRooms);
      mockPrismaService.room.count.mockResolvedValue(1);

      await service.findAll(filterDto as any);

      expect(mockPrismaService.room.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: RoomStatus.AVAILABLE,
          }),
        }),
      );
    });

    it('should filter by price range', async () => {
      const filterDto = {
        page: 1,
        limit: 10,
        skip: 0,
        minPrice: 3000000,
        maxPrice: 7000000,
      };
      const mockRooms = [
        {
          ...TestDataFactory.createRoom({ pricePerMonth: 5000000 }),
          property: {
            id: 'property-1',
            name: 'Property 1',
            address: '123 St',
            city: 'City 1',
            ward: 'Ward 1',
          },
        },
      ];

      mockPrismaService.room.findMany.mockResolvedValue(mockRooms);
      mockPrismaService.room.count.mockResolvedValue(1);

      await service.findAll(filterDto as any);

      expect(mockPrismaService.room.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            pricePerMonth: {
              gte: 3000000,
              lte: 7000000,
            },
          }),
        }),
      );
    });

    it('should filter by area range', async () => {
      const filterDto = {
        page: 1,
        limit: 10,
        skip: 0,
        minArea: 20,
        maxArea: 40,
      };
      const mockRooms = [
        {
          ...TestDataFactory.createRoom({ area: 30 }),
          property: {
            id: 'property-1',
            name: 'Property 1',
            address: '123 St',
            city: 'City 1',
            ward: 'Ward 1',
          },
        },
      ];

      mockPrismaService.room.findMany.mockResolvedValue(mockRooms);
      mockPrismaService.room.count.mockResolvedValue(1);

      await service.findAll(filterDto as any);

      expect(mockPrismaService.room.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            area: {
              gte: 20,
              lte: 40,
            },
          }),
        }),
      );
    });

    it('should filter by propertyId', async () => {
      const filterDto = {
        page: 1,
        limit: 10,
        skip: 0,
        propertyId: 'property-123',
      };
      const mockRooms = [
        {
          ...TestDataFactory.createRoom({ propertyId: 'property-123' }),
          property: {
            id: 'property-123',
            name: 'Property 1',
            address: '123 St',
            city: 'City 1',
            ward: 'Ward 1',
          },
        },
      ];

      mockPrismaService.room.findMany.mockResolvedValue(mockRooms);
      mockPrismaService.room.count.mockResolvedValue(1);

      await service.findAll(filterDto as any);

      expect(mockPrismaService.room.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            propertyId: 'property-123',
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a room by id with all relations', async () => {
      const mockRoom = {
        ...TestDataFactory.createRoom(),
        property: {
          id: 'property-1',
          name: 'Property 1',
          address: '123 St',
          city: 'City 1',
          ward: 'Ward 1',
        },
        images: [],
        amenities: [],
        reviews: [],
      };
      mockPrismaService.room.findUnique.mockResolvedValue(mockRoom);

      const result = await service.findOne(mockRoom.id);

      expect(result).toHaveProperty('id', mockRoom.id);
      expect(mockPrismaService.room.findUnique).toHaveBeenCalledWith({
        where: { id: mockRoom.id },
        include: {
          property: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
              ward: true,
            },
          },
          images: true,
          amenities: true,
          reviews: {
            select: {
              rating: true,
            },
          },
        },
      });
    });

    it('should throw NotFoundException if room not found', async () => {
      mockPrismaService.room.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        'Room with ID non-existent-id not found',
      );
    });
  });

  describe('update', () => {
    it('should update a room', async () => {
      const roomId = 'room-123';
      const updateDto = { pricePerMonth: 6000000 };
      const mockRoomBefore = {
        ...TestDataFactory.createRoom({ id: roomId }),
        property: {
          id: 'property-1',
          name: 'Property 1',
          address: '123 St',
          city: 'City 1',
          ward: 'Ward 1',
        },
        images: [],
        amenities: [],
        reviews: [],
      };
      const mockRoomAfter = {
        ...mockRoomBefore,
        ...updateDto,
      };

      mockPrismaService.room.findUnique.mockResolvedValue(mockRoomBefore);
      mockPrismaService.room.update.mockResolvedValue(mockRoomAfter);

      const result = await service.update(roomId, updateDto, mockAdminUser);

      expect(result).toHaveProperty('id', roomId);
      expect(mockPrismaService.room.update).toHaveBeenCalledWith({
        where: { id: roomId },
        data: updateDto,
        include: {
          property: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
              ward: true,
            },
          },
          images: true,
          amenities: true,
          reviews: true,
        },
      });
    });

    it('should throw NotFoundException if room not found', async () => {
      mockPrismaService.room.findUnique.mockResolvedValue(null);

      await expect(service.update('non-existent-id', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete a room', async () => {
      const roomId = 'room-123';
      const mockRoom = {
        ...TestDataFactory.createRoom({ id: roomId }),
        property: {
          id: 'property-1',
          name: 'Property 1',
          address: '123 St',
          city: 'City 1',
          ward: 'Ward 1',
        },
        images: [],
        amenities: [],
        reviews: [],
      };

      mockPrismaService.room.findUnique.mockResolvedValue(mockRoom);
      mockPrismaService.room.delete.mockResolvedValue(mockRoom);

      await service.remove(roomId, mockAdminUser);

      expect(mockPrismaService.room.delete).toHaveBeenCalledWith({
        where: { id: roomId },
      });
    });

    it('should throw NotFoundException if room not found', async () => {
      mockPrismaService.room.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
