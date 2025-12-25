import { Test, TestingModule } from '@nestjs/testing';
import { TenantsService } from './tenants.service';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { faker } from '@faker-js/faker';

describe('TenantsService', () => {
  let service: TenantsService;
  let prismaService: PrismaService;

  const mockTenant = {
    userId: faker.string.uuid(),
    citizenId: '123456789012',
    dateOfBirth: new Date('1990-01-01'),
    address: faker.location.streetAddress(),
    emergencyContact: '0987654321',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    tenant: {
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
        TenantsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TenantsService>(TenantsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new tenant', async () => {
      const createDto = {
        userId: mockTenant.userId,
        citizenId: mockTenant.citizenId,
        dateOfBirth: '1990-01-01',
        address: mockTenant.address,
      };

      mockPrismaService.tenant.create.mockResolvedValue(mockTenant);

      const result = await service.create(createDto);

      expect(prismaService.tenant.create).toHaveBeenCalledWith({
        data: createDto,
      });
      expect(result).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should return paginated tenants', async () => {
      const tenants = [
        mockTenant,
        { ...mockTenant, userId: faker.string.uuid() },
      ];

      mockPrismaService.tenant.findMany.mockResolvedValue(tenants);
      mockPrismaService.tenant.count.mockResolvedValue(2);

      const result = await service.findAll({
        page: 1,
        limit: 10,
        skip: 0,
      });

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
    });

    it('should filter tenants by userId', async () => {
      mockPrismaService.tenant.findMany.mockResolvedValue([mockTenant]);
      mockPrismaService.tenant.count.mockResolvedValue(1);

      await service.findAll({
        page: 1,
        limit: 10,
        userId: mockTenant.userId,
        skip: 0,
      });

      expect(prismaService.tenant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: mockTenant.userId,
          }),
        }),
      );
    });

    it('should search tenants by multiple fields', async () => {
      mockPrismaService.tenant.findMany.mockResolvedValue([mockTenant]);
      mockPrismaService.tenant.count.mockResolvedValue(1);

      await service.findAll({
        page: 1,
        limit: 10,
        search: 'John',
        skip: 0,
      });

      expect(prismaService.tenant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                citizenId: expect.objectContaining({
                  contains: 'John',
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
    it('should return a tenant by id', async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);

      const result = await service.findOne(mockTenant.userId);

      expect(result).toBeDefined();
      expect(prismaService.tenant.findUnique).toHaveBeenCalledWith({
        where: { userId: mockTenant.userId },
      });
    });

    it('should throw NotFoundException if tenant not found', async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a tenant', async () => {
      const updateDto = { phoneNumber: '0999999999' };
      const updatedTenant = { ...mockTenant, phoneNumber: '0999999999' };

      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.tenant.update.mockResolvedValue(updatedTenant);

      const result = await service.update(mockTenant.userId, updateDto);

      expect(prismaService.tenant.update).toHaveBeenCalledWith({
        where: { userId: mockTenant.userId },
        data: updateDto,
      });
    });
  });

  describe('remove', () => {
    it('should delete a tenant', async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.tenant.delete.mockResolvedValue(mockTenant);

      const result = await service.remove(mockTenant.userId);

      expect(prismaService.tenant.delete).toHaveBeenCalledWith({
        where: { userId: mockTenant.userId },
      });
      expect(result).toEqual({ message: 'Tenant deleted successfully' });
    });
  });
});
