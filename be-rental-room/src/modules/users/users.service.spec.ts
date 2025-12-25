import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from 'src/database/prisma/prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: any;

  const mockUser = {
    id: 'user-123',
    fullName: 'Test User',
    email: 'test@example.com',
    phoneNumber: '+1234567890',
    role: 'TENANT',
    emailVerified: true,
    passwordHash: 'hashed_password',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockUserResponse = {
    id: mockUser.id,
    fullName: mockUser.fullName,
    email: mockUser.email,
    phoneNumber: mockUser.phoneNumber,
    role: mockUser.role,
    createdAt: mockUser.createdAt,
    updatedAt: mockUser.updatedAt,
  };

  beforeEach(async () => {
    const mockPrismaService = {
      user: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all users without password hash', async () => {
      const users = [mockUserResponse, { ...mockUserResponse, id: 'user-456' }];
      prismaService.user.findMany.mockResolvedValue(users);

      const result = await service.findAll();

      expect(result).toEqual(users);
      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          fullName: true,
          email: true,
          phoneNumber: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    it('should return empty array when no users exist', async () => {
      prismaService.user.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return user by id with relations', async () => {
      const userWithRelations = {
        ...mockUserResponse,
        tenant: { userId: 'user-123', fullName: 'Test Tenant' },
        landlord: null,
      };
      prismaService.user.findUnique.mockResolvedValue(userWithRelations);

      const result = await service.findOne('user-123');

      expect(result).toEqual(userWithRelations);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: {
          id: true,
          fullName: true,
          email: true,
          phoneNumber: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          tenant: true,
          landlord: true,
        },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(
        new NotFoundException('User not found'),
      );
    });

    it('should return user without tenant/landlord relations', async () => {
      const adminUser = {
        ...mockUserResponse,
        role: 'ADMIN',
        tenant: null,
        landlord: null,
      };
      prismaService.user.findUnique.mockResolvedValue(adminUser);

      const result = await service.findOne('user-123');

      expect(result).toEqual(adminUser);
      expect(result.tenant).toBeNull();
      expect(result.landlord).toBeNull();
    });
  });
});
