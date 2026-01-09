import { Test, TestingModule } from '@nestjs/testing';
import { LandlordsService } from './landlords.service';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { faker } from '@faker-js/faker';
import { UserRole } from '@prisma/client';

describe('LandlordsService', () => {
  let service: LandlordsService;
  let prismaService: PrismaService;

  const mockAdminUser = {
    id: 'admin-user-1',
    role: UserRole.ADMIN,
  };

  const mockLandlord = {
    userId: faker.string.uuid(),
    citizenId: '123456789012',
    dateOfBirth: new Date('1985-05-15'),
    address: faker.location.streetAddress(),
    bankAccount: '1234567890',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    landlord: {
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
        LandlordsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<LandlordsService>(LandlordsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new landlord', async () => {
      const createDto = {
        userId: mockLandlord.userId,
        fullName: 'Test Landlord',
        email: 'landlord@example.com',
        phoneNumber: '0987654321',
        citizenId: mockLandlord.citizenId,
        dateOfBirth: '1985-05-15',
        address: mockLandlord.address,
        bankAccount: mockLandlord.bankAccount,
      };

      mockPrismaService.landlord.create.mockResolvedValue(mockLandlord);

      const result = await service.create(createDto);

      expect(prismaService.landlord.create).toHaveBeenCalledWith({
        data: createDto,
      });
      expect(result).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should return paginated landlords', async () => {
      const landlords = [
        mockLandlord,
        { ...mockLandlord, userId: faker.string.uuid() },
      ];

      mockPrismaService.landlord.findMany.mockResolvedValue(landlords);
      mockPrismaService.landlord.count.mockResolvedValue(2);

      const result = await service.findAll({
        page: 1,
        limit: 10,
        skip: 0,
      });

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
    });

    it('should filter landlords by userId', async () => {
      mockPrismaService.landlord.findMany.mockResolvedValue([mockLandlord]);
      mockPrismaService.landlord.count.mockResolvedValue(1);

      await service.findAll({
        page: 1,
        limit: 10,
        userId: mockLandlord.userId,
        skip: 0,
      });

      expect(prismaService.landlord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: mockLandlord.userId,
          }),
        }),
      );
    });

    it('should search landlords by multiple fields', async () => {
      mockPrismaService.landlord.findMany.mockResolvedValue([mockLandlord]);
      mockPrismaService.landlord.count.mockResolvedValue(1);

      await service.findAll({
        page: 1,
        limit: 10,
        search: 'John',
        skip: 0,
      });

      expect(prismaService.landlord.findMany).toHaveBeenCalledWith(
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
    it('should return a landlord by id', async () => {
      mockPrismaService.landlord.findUnique.mockResolvedValue(mockLandlord);

      const result = await service.findOne(mockLandlord.userId);

      expect(result).toBeDefined();
      expect(prismaService.landlord.findUnique).toHaveBeenCalledWith({
        where: { userId: mockLandlord.userId },
      });
    });

    it('should throw NotFoundException if landlord not found', async () => {
      mockPrismaService.landlord.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a landlord', async () => {
      const updateDto = { phoneNumber: '0999999999' };
      const updatedLandlord = { ...mockLandlord, phoneNumber: '0999999999' };

      mockPrismaService.landlord.findUnique.mockResolvedValue(mockLandlord);
      mockPrismaService.landlord.update.mockResolvedValue(updatedLandlord);

      const result = await service.update(
        mockLandlord.userId,
        updateDto,
        mockAdminUser,
      );

      expect(prismaService.landlord.update).toHaveBeenCalledWith({
        where: { userId: mockLandlord.userId },
        data: updateDto,
      });
    });
  });

  describe('remove', () => {
    it('should delete a landlord', async () => {
      mockPrismaService.landlord.findUnique.mockResolvedValue(mockLandlord);
      mockPrismaService.landlord.delete.mockResolvedValue(mockLandlord);

      const result = await service.remove(mockLandlord.userId);

      expect(prismaService.landlord.delete).toHaveBeenCalledWith({
        where: { userId: mockLandlord.userId },
      });
      expect(result).toEqual({ message: 'Landlord deleted successfully' });
    });
  });
});
