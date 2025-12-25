import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from 'src/database/prisma/prisma.service';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let prismaService: PrismaService;
  let configService: ConfigService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    mockConfigService.get.mockReturnValue('test-jwt-secret');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    prismaService = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return user object when user exists', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'tenant',
        fullName: 'Test User',
        phoneNumber: '1234567890',
      };

      const payload = {
        sub: 'user-123',
        email: 'test@example.com',
        role: 'tenant',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        role: 'tenant',
      });
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
      const payload = {
        sub: 'non-existent-user',
        email: 'nonexistent@example.com',
        role: 'tenant',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(strategy.validate(payload)).rejects.toThrow(
        'User not found',
      );
    });

    it('should validate admin user', async () => {
      const mockUser = {
        id: 'admin-456',
        email: 'admin@example.com',
        role: 'admin',
        fullName: 'Admin User',
      };

      const payload = {
        sub: 'admin-456',
        email: 'admin@example.com',
        role: 'admin',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        id: 'admin-456',
        email: 'admin@example.com',
        role: 'admin',
      });
    });

    it('should validate landlord user', async () => {
      const mockUser = {
        id: 'landlord-789',
        email: 'landlord@example.com',
        role: 'landlord',
        fullName: 'Landlord User',
      };

      const payload = {
        sub: 'landlord-789',
        email: 'landlord@example.com',
        role: 'landlord',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        id: 'landlord-789',
        email: 'landlord@example.com',
        role: 'landlord',
      });
    });

    it('should only return id, email, and role properties', async () => {
      const mockUser = {
        id: 'user-999',
        email: 'user@example.com',
        role: 'tenant',
        fullName: 'Full Name',
        phoneNumber: '9876543210',
        password: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const payload = {
        sub: 'user-999',
        email: 'user@example.com',
        role: 'tenant',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        id: 'user-999',
        email: 'user@example.com',
        role: 'tenant',
      });
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('fullName');
      expect(result).not.toHaveProperty('phoneNumber');
    });
  });

  describe('configuration', () => {
    it('should use JWT_SECRET from config service', () => {
      expect(configService.get).toHaveBeenCalledWith('JWT_SECRET');
    });
  });
});
