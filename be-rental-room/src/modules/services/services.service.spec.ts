import { Test, TestingModule } from '@nestjs/testing';
import { ServicesService } from './services.service';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { faker } from '@faker-js/faker';
import { ServiceType, BillingMethod } from './entities';

describe('ServicesService', () => {
  let service: ServicesService;
  let prismaService: PrismaService;

  const mockService = {
    id: faker.string.uuid(),
    propertyId: faker.string.uuid(),
    serviceName: 'Electricity',
    serviceType: ServiceType.ELECTRICITY,
    billingMethod: BillingMethod.METERED,
    unitPrice: 3500,
    unit: 'kWh',
    description: 'Electricity billing per unit consumed',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    service: {
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
        ServicesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ServicesService>(ServicesService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new service', async () => {
      const createDto = {
        propertyId: mockService.propertyId,
        serviceName: mockService.serviceName,
        serviceType: mockService.serviceType,
        billingMethod: mockService.billingMethod,
        unitPrice: mockService.unitPrice,
        unit: mockService.unit,
        description: mockService.description,
      };

      mockPrismaService.service.create.mockResolvedValue(mockService);

      const result = await service.create(createDto);

      expect(prismaService.service.create).toHaveBeenCalledWith({
        data: createDto,
      });
      expect(result).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should return paginated services', async () => {
      const services = [
        mockService,
        { ...mockService, id: faker.string.uuid() },
      ];

      mockPrismaService.service.findMany.mockResolvedValue(services);
      mockPrismaService.service.count.mockResolvedValue(2);

      const result = await service.findAll({
        page: 1,
        limit: 10,
        skip: 0,
      });

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
    });

    it('should filter services by service type', async () => {
      mockPrismaService.service.findMany.mockResolvedValue([mockService]);
      mockPrismaService.service.count.mockResolvedValue(1);

      await service.findAll({
        page: 1,
        limit: 10,
        serviceType: ServiceType.ELECTRICITY,
        skip: 0,
      });

      expect(prismaService.service.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            serviceType: ServiceType.ELECTRICITY,
          }),
        }),
      );
    });

    it('should filter services by billing method', async () => {
      mockPrismaService.service.findMany.mockResolvedValue([mockService]);
      mockPrismaService.service.count.mockResolvedValue(1);

      await service.findAll({
        page: 1,
        limit: 10,
        billingMethod: BillingMethod.METERED,
        skip: 0,
      });

      expect(prismaService.service.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            billingMethod: BillingMethod.METERED,
          }),
        }),
      );
    });

    it('should search services by name or description', async () => {
      mockPrismaService.service.findMany.mockResolvedValue([mockService]);
      mockPrismaService.service.count.mockResolvedValue(1);

      await service.findAll({
        page: 1,
        limit: 10,
        search: 'Electricity',
        skip: 0,
      });

      expect(prismaService.service.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                serviceName: expect.objectContaining({
                  contains: 'Electricity',
                  mode: 'insensitive',
                }),
              }),
            ]),
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a service by id', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue(mockService);

      const result = await service.findOne(mockService.id);

      expect(result).toBeDefined();
      expect(prismaService.service.findUnique).toHaveBeenCalledWith({
        where: { id: mockService.id },
        include: { property: true },
      });
    });

    it('should throw NotFoundException if service not found', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a service', async () => {
      const updateDto = { unitPrice: 4000 };
      const updatedService = { ...mockService, unitPrice: 4000 };

      mockPrismaService.service.findUnique.mockResolvedValue(mockService);
      mockPrismaService.service.update.mockResolvedValue(updatedService);

      const result = await service.update(mockService.id, updateDto);

      expect(prismaService.service.update).toHaveBeenCalledWith({
        where: { id: mockService.id },
        data: updateDto,
        include: { property: true },
      });
    });
  });

  describe('remove', () => {
    it('should delete a service', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue(mockService);
      mockPrismaService.service.delete.mockResolvedValue(mockService);

      const result = await service.remove(mockService.id);

      expect(prismaService.service.delete).toHaveBeenCalledWith({
        where: { id: mockService.id },
      });
      expect(result).toEqual({ message: 'Service deleted successfully' });
    });
  });
});
