import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { PrismaService } from '../../database/prisma/prisma.service';
import { TestDataFactory } from '../../../test/utils/test-data.factory';
import { PropertyType } from './entities/property.entity';

describe('PropertiesService', () => {
  let service: PropertiesService;
  let prisma: PrismaService;

  const mockPrismaService = {
    property: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertiesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PropertiesService>(PropertiesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new property', async () => {
      const createDto = {
        landlordId: 'landlord-123',
        name: 'Test Property',
        address: '123 Test St',
        city: 'Test City',
        ward: 'Test Ward',
        propertyType: PropertyType.APARTMENT,
      };

      const mockProperty = TestDataFactory.createProperty(createDto);
      mockPrismaService.property.create.mockResolvedValue(mockProperty);

      const result = await service.create(createDto);

      expect(result).toEqual(mockProperty);
      expect(mockPrismaService.property.create).toHaveBeenCalledWith({
        data: createDto,
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated properties', async () => {
      const filterDto = { page: 1, limit: 10, skip: 0 };
      const mockProperties = [
        { ...TestDataFactory.createProperty(), _count: { rooms: 5 } },
        { ...TestDataFactory.createProperty(), _count: { rooms: 3 } },
      ];

      mockPrismaService.property.findMany.mockResolvedValue(mockProperties);
      mockPrismaService.property.count.mockResolvedValue(2);

      const result = await service.findAll(filterDto as any);

      expect(result.data.length).toBe(2);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
      expect(mockPrismaService.property.findMany).toHaveBeenCalled();
    });

    it('should filter by landlordId', async () => {
      const filterDto = {
        page: 1,
        limit: 10,
        skip: 0,
        landlordId: 'landlord-123',
      };
      const mockProperties = [
        {
          ...TestDataFactory.createProperty({ landlordId: 'landlord-123' }),
          _count: { rooms: 2 },
        },
      ];

      mockPrismaService.property.findMany.mockResolvedValue(mockProperties);
      mockPrismaService.property.count.mockResolvedValue(1);

      await service.findAll(filterDto as any);

      expect(mockPrismaService.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            landlordId: 'landlord-123',
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a property by id', async () => {
      const mockProperty = {
        ...TestDataFactory.createProperty(),
        _count: { rooms: 4 },
      };
      mockPrismaService.property.findUnique.mockResolvedValue(mockProperty);

      const result = await service.findOne(mockProperty.id);

      expect(result).toHaveProperty('id', mockProperty.id);
      expect(mockPrismaService.property.findUnique).toHaveBeenCalledWith({
        where: { id: mockProperty.id },
        include: {
          _count: {
            select: { rooms: true },
          },
        },
      });
    });

    it('should throw NotFoundException if property not found', async () => {
      mockPrismaService.property.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a property', async () => {
      const propertyId = 'property-123';
      const updateDto = { name: 'Updated Property Name' };
      const mockProperty = {
        ...TestDataFactory.createProperty({ id: propertyId, ...updateDto }),
        _count: { rooms: 4 },
      };

      mockPrismaService.property.findUnique.mockResolvedValue(mockProperty);
      mockPrismaService.property.update.mockResolvedValue(mockProperty);

      const result = await service.update(propertyId, updateDto);

      expect(result).toHaveProperty('id', propertyId);
      expect(mockPrismaService.property.update).toHaveBeenCalledWith({
        where: { id: propertyId },
        data: updateDto,
      });
    });

    it('should throw NotFoundException if property not found', async () => {
      mockPrismaService.property.findUnique.mockResolvedValue(null);

      await expect(
        service.update('non-existent-id', { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a property', async () => {
      const propertyId = 'property-123';
      const mockProperty = {
        ...TestDataFactory.createProperty({ id: propertyId }),
        _count: { rooms: 0 },
      };

      mockPrismaService.property.findUnique.mockResolvedValue(mockProperty);
      mockPrismaService.property.delete.mockResolvedValue(mockProperty);

      await service.remove(propertyId);

      expect(mockPrismaService.property.delete).toHaveBeenCalledWith({
        where: { id: propertyId },
      });
    });

    it('should throw NotFoundException if property not found', async () => {
      mockPrismaService.property.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
