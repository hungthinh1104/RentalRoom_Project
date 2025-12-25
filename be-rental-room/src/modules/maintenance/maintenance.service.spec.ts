import { Test, TestingModule } from '@nestjs/testing';
import { MaintenanceService } from './maintenance.service';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { faker } from '@faker-js/faker';
import {
  MaintenanceStatus,
  MaintenancePriority,
  MaintenanceCategory,
} from './entities';

describe('MaintenanceService', () => {
  let service: MaintenanceService;
  let prismaService: PrismaService;

  const mockMaintenanceRequest = {
    id: faker.string.uuid(),
    roomId: faker.string.uuid(),
    tenantId: faker.string.uuid(),
    assignedTo: faker.string.uuid(),
    title: 'Leaking faucet',
    description: 'Kitchen faucet is leaking water',
    priority: MaintenancePriority.HIGH,
    category: MaintenanceCategory.PLUMBING,
    status: MaintenanceStatus.PENDING,
    requestDate: new Date(),
    completedAt: null,
    estimatedCost: 500000,
    actualCost: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    maintenanceRequest: {
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
        MaintenanceService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<MaintenanceService>(MaintenanceService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new maintenance request', async () => {
      const createDto = {
        roomId: mockMaintenanceRequest.roomId,
        tenantId: mockMaintenanceRequest.tenantId,
        title: mockMaintenanceRequest.title,
        description: mockMaintenanceRequest.description,
        priority: mockMaintenanceRequest.priority,
        category: mockMaintenanceRequest.category,
        requestDate: '2024-01-15',
      };

      mockPrismaService.maintenanceRequest.create.mockResolvedValue(
        mockMaintenanceRequest,
      );

      const result = await service.create(createDto);

      expect(prismaService.maintenanceRequest.create).toHaveBeenCalledWith({
        data: createDto,
      });
      expect(result).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should return paginated maintenance requests', async () => {
      const requests = [
        mockMaintenanceRequest,
        { ...mockMaintenanceRequest, id: faker.string.uuid() },
      ];

      mockPrismaService.maintenanceRequest.findMany.mockResolvedValue(requests);
      mockPrismaService.maintenanceRequest.count.mockResolvedValue(2);

      const result = await service.findAll({
        page: 1,
        limit: 10,
        skip: 0,
      });

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
    });

    it('should filter maintenance requests by status', async () => {
      mockPrismaService.maintenanceRequest.findMany.mockResolvedValue([
        mockMaintenanceRequest,
      ]);
      mockPrismaService.maintenanceRequest.count.mockResolvedValue(1);

      await service.findAll({
        page: 1,
        limit: 10,
        status: MaintenanceStatus.PENDING,
        skip: 0,
      });

      expect(prismaService.maintenanceRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: MaintenanceStatus.PENDING,
          }),
        }),
      );
    });

    it('should filter maintenance requests by priority', async () => {
      mockPrismaService.maintenanceRequest.findMany.mockResolvedValue([
        mockMaintenanceRequest,
      ]);
      mockPrismaService.maintenanceRequest.count.mockResolvedValue(1);

      await service.findAll({
        page: 1,
        limit: 10,
        priority: MaintenancePriority.HIGH,
        skip: 0,
      });

      expect(prismaService.maintenanceRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            priority: MaintenancePriority.HIGH,
          }),
        }),
      );
    });

    it('should search maintenance requests by title or description', async () => {
      mockPrismaService.maintenanceRequest.findMany.mockResolvedValue([
        mockMaintenanceRequest,
      ]);
      mockPrismaService.maintenanceRequest.count.mockResolvedValue(1);

      await service.findAll({
        page: 1,
        limit: 10,
        search: 'leaking',
        skip: 0,
      });

      expect(prismaService.maintenanceRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                title: expect.objectContaining({
                  contains: 'leaking',
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
    it('should return a maintenance request by id', async () => {
      mockPrismaService.maintenanceRequest.findUnique.mockResolvedValue(
        mockMaintenanceRequest,
      );

      const result = await service.findOne(mockMaintenanceRequest.id);

      expect(result).toBeDefined();
      expect(prismaService.maintenanceRequest.findUnique).toHaveBeenCalledWith({
        where: { id: mockMaintenanceRequest.id },
      });
    });

    it('should throw NotFoundException if maintenance request not found', async () => {
      mockPrismaService.maintenanceRequest.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a maintenance request', async () => {
      const updateDto = { status: MaintenanceStatus.IN_PROGRESS };
      const updatedRequest = {
        ...mockMaintenanceRequest,
        status: MaintenanceStatus.IN_PROGRESS,
      };

      mockPrismaService.maintenanceRequest.findUnique.mockResolvedValue(
        mockMaintenanceRequest,
      );
      mockPrismaService.maintenanceRequest.update.mockResolvedValue(
        updatedRequest,
      );

      const result = await service.update(mockMaintenanceRequest.id, updateDto);

      expect(prismaService.maintenanceRequest.update).toHaveBeenCalledWith({
        where: { id: mockMaintenanceRequest.id },
        data: updateDto,
      });
    });
  });

  describe('complete', () => {
    it('should mark a maintenance request as completed', async () => {
      const completedRequest = {
        ...mockMaintenanceRequest,
        status: MaintenanceStatus.COMPLETED,
        completedAt: new Date(),
      };

      mockPrismaService.maintenanceRequest.findUnique.mockResolvedValue(
        mockMaintenanceRequest,
      );
      mockPrismaService.maintenanceRequest.update.mockResolvedValue(
        completedRequest,
      );

      const result = await service.complete(mockMaintenanceRequest.id);

      expect(prismaService.maintenanceRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockMaintenanceRequest.id },
          data: expect.objectContaining({
            status: MaintenanceStatus.COMPLETED,
            completedAt: expect.any(Date),
          }),
        }),
      );
    });
  });

  describe('remove', () => {
    it('should delete a maintenance request', async () => {
      mockPrismaService.maintenanceRequest.findUnique.mockResolvedValue(
        mockMaintenanceRequest,
      );
      mockPrismaService.maintenanceRequest.delete.mockResolvedValue(
        mockMaintenanceRequest,
      );

      const result = await service.remove(mockMaintenanceRequest.id);

      expect(prismaService.maintenanceRequest.delete).toHaveBeenCalledWith({
        where: { id: mockMaintenanceRequest.id },
      });
      expect(result).toEqual({
        message: 'Maintenance request deleted successfully',
      });
    });
  });
});
