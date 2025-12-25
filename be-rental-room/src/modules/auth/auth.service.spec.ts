import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { EmailService } from 'src/common/services/email.service';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: jest.Mocked<PrismaService>;
  let jwtService: jest.Mocked<JwtService>;
  let emailService: jest.Mocked<EmailService>;
  let configService: jest.Mocked<ConfigService>;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    fullName: 'Test User',
    passwordHash: 'hashed_password',
    phoneNumber: '+1234567890',
    role: 'TENANT' as const,
    emailVerified: true,
    verificationCode: null,
    verificationExpiry: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrismaService = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      landlord: {
        create: jest.fn(),
      },
      tenant: {
        create: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(mockPrismaService)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendVerificationEmail: jest.fn(),
            sendWelcomeEmail: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                JWT_SECRET: 'test-secret',
                JWT_REFRESH_SECRET: 'test-refresh-secret',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get(PrismaService);
    jwtService = module.get(JwtService);
    emailService = module.get(EmailService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      email: 'newuser@example.com',
      password: 'SecurePass123!',
      fullName: 'New User',
      phone: '+1234567890',
      role: 'TENANT' as const,
    };

    it('should successfully register a new user and send verification email', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');

      const newUser = {
        ...mockUser,
        email: registerDto.email,
        fullName: registerDto.fullName,
        emailVerified: false,
        verificationCode: '123456',
        verificationExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      prismaService.user.create.mockResolvedValue(newUser);
      emailService.sendVerificationEmail.mockResolvedValue();

      const result = await service.register(registerDto);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(prismaService.user.create).toHaveBeenCalled();
      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
        newUser.email,
        newUser.fullName,
        expect.any(String), // verification code
      );
      expect(result).toEqual({
        message:
          'Registration successful. Please check your email to verify your account.',
      });
    });

    it('should throw ConflictException if email already exists', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        new ConflictException('Email already registered'),
      );

      expect(prismaService.user.create).not.toHaveBeenCalled();
      expect(emailService.sendVerificationEmail).not.toHaveBeenCalled();
    });
  });

  describe('validateUser', () => {
    it('should return user data if credentials are valid and email verified', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        fullName: mockUser.fullName,
        role: mockUser.role,
      });
    });

    it('should return null if user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUser(
        'nonexistent@example.com',
        'password',
      );

      expect(result).toBeNull();
    });

    it('should throw UnauthorizedException if email not verified', async () => {
      const unverifiedUser = { ...mockUser, emailVerified: false };
      prismaService.user.findUnique.mockResolvedValue(unverifiedUser);

      await expect(
        service.validateUser('test@example.com', 'password'),
      ).rejects.toThrow(
        new UnauthorizedException('Please verify your email before logging in'),
      );
    });

    it('should return null if password is invalid', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser(
        'test@example.com',
        'wrongpassword',
      );

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    const loginUser = {
      id: mockUser.id,
      email: mockUser.email,
      fullName: mockUser.fullName,
      role: mockUser.role,
    };

    it('should return tokens and user data', async () => {
      jwtService.signAsync
        .mockResolvedValueOnce('access_token')
        .mockResolvedValueOnce('refresh_token');

      const result = await service.login(loginUser);

      expect(result).toEqual({
        access_token: 'access_token',
        refresh_token: 'refresh_token',
        user: loginUser,
      });
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
    });
  });

  describe('refreshToken', () => {
    it('should return new access token if refresh token is valid', async () => {
      const payload = {
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      };
      jwtService.verify.mockReturnValue(payload);
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      jwtService.signAsync.mockResolvedValue('new_access_token');

      const result = await service.refreshToken('valid_refresh_token');

      expect(result).toEqual({ access_token: 'new_access_token' });
      expect(jwtService.verify).toHaveBeenCalledWith('valid_refresh_token', {
        secret: 'test-refresh-secret',
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const payload = {
        sub: 'nonexistent-id',
        email: 'test@example.com',
        role: 'TENANT',
      };
      jwtService.verify.mockReturnValue(payload);
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.refreshToken('valid_refresh_token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if token is invalid', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refreshToken('invalid_token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('verifyEmail', () => {
    it('should successfully verify email and send welcome email', async () => {
      const unverifiedUser = {
        ...mockUser,
        emailVerified: false,
        verificationCode: '123456',
        verificationExpiry: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      };

      prismaService.user.findFirst.mockResolvedValue(unverifiedUser);
      prismaService.user.update.mockResolvedValue({
        ...unverifiedUser,
        emailVerified: true,
      });
      emailService.sendWelcomeEmail.mockResolvedValue();

      const result = await service.verifyEmail('123456');

      expect(result).toEqual({
        message: 'Email verified successfully. You can now login.',
      });
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: unverifiedUser.id },
        data: {
          emailVerified: true,
          verificationCode: null,
          verificationExpiry: null,
        },
      });
      expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith(
        unverifiedUser.email,
        unverifiedUser.fullName,
      );
    });

    it('should throw BadRequestException if verification code not found', async () => {
      prismaService.user.findFirst.mockResolvedValue(null);

      await expect(service.verifyEmail('invalid_code')).rejects.toThrow(
        new BadRequestException('Invalid verification code'),
      );
    });

    it('should throw BadRequestException if email already verified', async () => {
      prismaService.user.findFirst.mockResolvedValue({
        ...mockUser,
        emailVerified: true,
        verificationCode: '123456',
      });

      await expect(service.verifyEmail('123456')).rejects.toThrow(
        new BadRequestException('Email already verified'),
      );
    });

    it('should throw BadRequestException if verification code expired', async () => {
      const expiredUser = {
        ...mockUser,
        emailVerified: false,
        verificationCode: '123456',
        verificationExpiry: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      };

      prismaService.user.findFirst.mockResolvedValue(expiredUser);

      await expect(service.verifyEmail('123456')).rejects.toThrow(
        new BadRequestException('Verification code has expired'),
      );
    });
  });

  describe('resendVerification', () => {
    it('should successfully resend verification email', async () => {
      const unverifiedUser = {
        ...mockUser,
        emailVerified: false,
        verificationCode: 'old_code',
      };

      prismaService.user.findUnique.mockResolvedValue(unverifiedUser);
      prismaService.user.update.mockResolvedValue({
        ...unverifiedUser,
        verificationCode: 'new_code',
      });
      emailService.sendVerificationEmail.mockResolvedValue();

      const result = await service.resendVerification('test@example.com');

      expect(result).toEqual({
        message: 'Verification email sent. Please check your inbox.',
      });
      expect(prismaService.user.update).toHaveBeenCalled();
      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
        unverifiedUser.email,
        unverifiedUser.fullName,
        expect.any(String),
      );
    });

    it('should throw BadRequestException if user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.resendVerification('nonexistent@example.com'),
      ).rejects.toThrow(new BadRequestException('User not found'));
    });

    it('should throw BadRequestException if email already verified', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        emailVerified: true,
      });

      await expect(
        service.resendVerification('test@example.com'),
      ).rejects.toThrow(new BadRequestException('Email already verified'));
    });
  });
});
