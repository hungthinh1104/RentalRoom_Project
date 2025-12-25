import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { LocalStrategy } from './local.strategy';
import { AuthService } from '../auth.service';

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;
  let authService: AuthService;

  const mockAuthService = {
    validateUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStrategy,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    strategy = module.get<LocalStrategy>(LocalStrategy);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return user when credentials are valid', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'tenant',
        fullName: 'Test User',
      };

      mockAuthService.validateUser.mockResolvedValue(mockUser);

      const result = await strategy.validate('test@example.com', 'password123');

      expect(result).toEqual(mockUser);
      expect(authService.validateUser).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
      );
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(
        strategy.validate('invalid@example.com', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);

      await expect(
        strategy.validate('invalid@example.com', 'wrongpassword'),
      ).rejects.toThrow('Invalid credentials');
    });

    it('should validate admin credentials', async () => {
      const mockAdmin = {
        id: 'admin-456',
        email: 'admin@example.com',
        role: 'admin',
        fullName: 'Admin User',
      };

      mockAuthService.validateUser.mockResolvedValue(mockAdmin);

      const result = await strategy.validate(
        'admin@example.com',
        'adminpassword',
      );

      expect(result).toEqual(mockAdmin);
    });

    it('should validate landlord credentials', async () => {
      const mockLandlord = {
        id: 'landlord-789',
        email: 'landlord@example.com',
        role: 'landlord',
        fullName: 'Landlord User',
      };

      mockAuthService.validateUser.mockResolvedValue(mockLandlord);

      const result = await strategy.validate(
        'landlord@example.com',
        'landlordpassword',
      );

      expect(result).toEqual(mockLandlord);
    });

    it('should throw UnauthorizedException when user is undefined', async () => {
      mockAuthService.validateUser.mockResolvedValue(undefined);

      await expect(
        strategy.validate('test@example.com', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user is null', async () => {
      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(
        strategy.validate('test@example.com', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should call validateUser with correct email and password', async () => {
      const email = 'specific@example.com';
      const password = 'specificPassword123';

      mockAuthService.validateUser.mockResolvedValue({
        id: 'user-999',
        email,
        role: 'tenant',
      });

      await strategy.validate(email, password);

      expect(authService.validateUser).toHaveBeenCalledWith(email, password);
      expect(authService.validateUser).toHaveBeenCalledTimes(1);
    });

    it('should handle empty password', async () => {
      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(strategy.validate('test@example.com', '')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should handle empty email', async () => {
      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(strategy.validate('', 'password123')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
