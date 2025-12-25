import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto/auth.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    verifyEmail: jest.fn(),
    resendVerification: jest.fn(),
    login: jest.fn(),
    refreshToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        phone: '0901234567',
        role: 'TENANT',
      };

      const mockResponse = {
        message:
          'Registration successful. Please check your email to verify your account.',
      };

      mockAuthService.register.mockResolvedValue(mockResponse);

      const result = await controller.register(registerDto);

      expect(result).toEqual(mockResponse);
      expect(service.register).toHaveBeenCalledWith(registerDto);
      expect(service.register).toHaveBeenCalledTimes(1);
    });

    it('should pass the correct DTO to service', async () => {
      const registerDto: RegisterDto = {
        email: 'new@example.com',
        password: 'securepass',
        fullName: 'New User',
        phone: '0987654321',
        role: 'TENANT',
      };

      mockAuthService.register.mockResolvedValue({ message: 'Success' });

      await controller.register(registerDto);

      expect(service.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('verifyEmail', () => {
    it('should verify email with valid code', async () => {
      const code = '123456';
      const mockResponse = { message: 'Email verified successfully' };

      mockAuthService.verifyEmail.mockResolvedValue(mockResponse);

      const result = await controller.verifyEmail(code);

      expect(result).toEqual(mockResponse);
      expect(service.verifyEmail).toHaveBeenCalledWith(code);
      expect(service.verifyEmail).toHaveBeenCalledTimes(1);
    });

    it('should call verifyEmail with different codes', async () => {
      const codes = ['111111', '999999', 'ABC123'];

      for (const code of codes) {
        mockAuthService.verifyEmail.mockResolvedValue({ message: 'Verified' });
        await controller.verifyEmail(code);
        expect(service.verifyEmail).toHaveBeenCalledWith(code);
      }
    });
  });

  describe('resendVerification', () => {
    it('should resend verification email', async () => {
      const email = 'test@example.com';
      const mockResponse = { message: 'Verification email sent' };

      mockAuthService.resendVerification.mockResolvedValue(mockResponse);

      const result = await controller.resendVerification(email);

      expect(result).toEqual(mockResponse);
      expect(service.resendVerification).toHaveBeenCalledWith(email);
      expect(service.resendVerification).toHaveBeenCalledTimes(1);
    });

    it('should handle different email addresses', async () => {
      const emails = ['user1@test.com', 'admin@example.com'];

      for (const email of emails) {
        mockAuthService.resendVerification.mockResolvedValue({
          message: 'Sent',
        });
        await controller.resendVerification(email);
        expect(service.resendVerification).toHaveBeenCalledWith(email);
      }
    });
  });

  describe('login', () => {
    it('should login user and return tokens', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'tenant',
      };

      const mockResponse = {
        access_token: 'jwt-access-token',
        refresh_token: 'jwt-refresh-token',
        user: {
          id: 'user-123',
          email: 'test@example.com',
          fullName: 'Test User',
          role: 'tenant',
        },
      };

      const mockRequest = { user: mockUser } as any;
      const mockRes = { cookie: jest.fn(), clearCookie: jest.fn() } as any;

      mockAuthService.login.mockResolvedValue(mockResponse);

      const result = await controller.login(mockRequest, mockRes);

      // Controller sets refresh cookie but returns the payload without the refresh_token
      const { refresh_token, ...rest } = mockResponse as any;
      expect(result).toEqual(rest);
      expect(service.login).toHaveBeenCalledWith(mockUser);
      expect(service.login).toHaveBeenCalledTimes(1);
    });

    it('should extract user from request', async () => {
      const loginDto: LoginDto = {
        email: 'admin@example.com',
        password: 'adminpass',
      };

      const adminUser = {
        id: 'admin-1',
        email: 'admin@example.com',
        role: 'admin',
      };

      const mockRequest = { user: adminUser } as any;
      const mockRes = { cookie: jest.fn(), clearCookie: jest.fn() } as any;

      mockAuthService.login.mockResolvedValue({
        access_token: 'token',
        refresh_token: 'refresh',
        user: adminUser as any,
      });

      await controller.login(mockRequest, mockRes);

      expect(service.login).toHaveBeenCalledWith(adminUser);
    });
  });

  describe('refreshToken', () => {
    it('should refresh access token', async () => {
      const mockRequest = {
        body: { refresh_token: 'valid-refresh-token' },
        cookies: {},
      } as any;

      const mockResponse = {
        access_token: 'new-access-token',
      };

      mockAuthService.refreshToken.mockResolvedValue(mockResponse);

      const result = await controller.refreshToken(mockRequest);

      expect(result).toEqual(mockResponse);
      expect(service.refreshToken).toHaveBeenCalledWith('valid-refresh-token');
      expect(service.refreshToken).toHaveBeenCalledTimes(1);
    });

    it('should pass refresh token string to service', async () => {
      const mockRequest = {
        body: { refresh_token: 'test-token-123' },
        cookies: {},
      } as any;

      mockAuthService.refreshToken.mockResolvedValue({ access_token: 'new' });

      await controller.refreshToken(mockRequest);

      expect(service.refreshToken).toHaveBeenCalledWith('test-token-123');
    });

    it('should handle different refresh tokens', async () => {
      const tokens = ['token1', 'token2', 'token3'];

      for (const token of tokens) {
        const mockRequest = {
          body: { refresh_token: token },
          cookies: {},
        } as any;
        mockAuthService.refreshToken.mockResolvedValue({ access_token: 'new' });

        await controller.refreshToken(mockRequest);

        expect(service.refreshToken).toHaveBeenCalledWith(token);
      }
    });

    it('should use cookie-supplied refresh token when body is empty', async () => {
      const cookieReq = { 
        body: {},
        cookies: { refresh_token: 'cookie-refresh-token' } 
      } as any;
      const mockResponse = { access_token: 'cookie-access' };

      mockAuthService.refreshToken.mockResolvedValue(mockResponse);

      const result = await controller.refreshToken(cookieReq);

      expect(service.refreshToken).toHaveBeenCalledWith('cookie-refresh-token');
      expect(result).toEqual(mockResponse);
    });
  });
});
