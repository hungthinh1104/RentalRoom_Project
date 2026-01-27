import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { PrismaService } from 'src/database/prisma/prisma.service';
import { RegisterDto, AuthResponseDto } from './dto/auth.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { EmailService } from 'src/common/services/email.service';
import type { IeKycService } from 'src/shared/integration/ekyc/ekyc.service.interface';
import { eKycResult } from 'src/shared/integration/ekyc/ekyc.types';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    @Inject('EKYC_SERVICE') private readonly eKycService: IeKycService,
  ) {}

  // ... (keep existing methods)

  /**
   * UC_AUTH_01: Verify user identity via eKYC
   */
  async verifyIdentity(
    userId: string,
    frontImage: string,
    backImage: string,
    selfie: string,
  ): Promise<eKycResult> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    if (user.ekycVerified) {
      throw new ConflictException('User already verified');
    }

    try {
      // Call eKYC provider
      const result = await this.eKycService.verifyIdentity(
        frontImage,
        backImage,
        selfie,
      );

      // Verify that the eKYC data matches the stored user name (if strictly enforced)
      // For now, we update the user with eKYC details

      if (result.verified) {
        await this.prisma.user.update({
          where: { id: userId },
          data: {
            ekycVerified: true,
            ekycStatus: 'VERIFIED',
            ekycData: result as any, // Store full result for audit
            ekycDocumentNumber: result.documentNumber,
            // Optionally update full name if we trust eKYC more
            // fullName: result.fullName
          },
        });
      } else {
        await this.prisma.user.update({
          where: { id: userId },
          data: {
            ekycStatus: 'REJECTED',
            ekycData: result as any,
          },
        });
        throw new BadRequestException(
          'eKYC Verification Failed: ' + (result as any).message ||
            'Liveness check failed',
        );
      }

      return result;
    } catch (error) {
      this.logger.error(`eKYC failed for user ${userId}`, error);
      throw new InternalServerErrorException('eKYC Service Error');
    }
  }

  /**
   * Generate a cryptographically strong random token for password reset (128 chars)
   */
  private generatePasswordResetToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  /**
   * Generate a 6-digit email verification code
   */
  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Validate password against minimum requirements
   * - At least 8 characters
   * - At least 1 uppercase letter
   * - At least 1 lowercase letter
   * - At least 1 number
   * - At least 1 special character (!@#$%^&*)
   */
  private validatePasswordPolicy(password: string): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least 1 uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least 1 lowercase letter');
    }
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least 1 number');
    }
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      errors.push(
        'Password must contain at least 1 special character (!@#$%^&*)',
      );
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async register(registerDto: RegisterDto): Promise<{ message: string }> {
    // Prevent creating admin via public registration
    if ((registerDto.role || '').toString().toUpperCase() === 'ADMIN') {
      throw new ForbiddenException('Cannot create ADMIN via registration');
    }

    // Validate password policy
    const pwValidation = this.validatePasswordPolicy(registerDto.password);
    if (!pwValidation.valid) {
      throw new BadRequestException({
        message: 'Password does not meet security requirements',
        errors: pwValidation.errors,
      });
    }

    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Generate 6-digit verification code
    const emailVerificationCode = this.generateVerificationCode();
    const emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    try {
      // Use transaction to ensure atomicity
      const user = await this.prisma.$transaction(async (tx) => {
        // Create user
        const newUser = await tx.user.create({
          data: {
            email: registerDto.email,
            passwordHash: hashedPassword,
            fullName: registerDto.fullName,
            phoneNumber: registerDto.phone || '',
            role: (registerDto.role || 'TENANT') as any,
            emailVerificationCode,
            emailVerificationExpiry,
          },
        });

        // Create tenant/landlord record based on role
        const role = newUser.role.toUpperCase();

        if (role === 'TENANT') {
          await tx.tenant.create({
            data: {
              userId: newUser.id,
            },
          });
        } else if (role === 'LANDLORD') {
          await tx.landlord.create({
            data: {
              userId: newUser.id,
            },
          });
        }

        return newUser;
      });

      // Send verification email (outside transaction)
      await this.emailService.sendVerificationEmail(
        user.email,
        user.fullName,
        emailVerificationCode,
      );

      return {
        message:
          'Registration successful. Please check your email to verify your account.',
      };
    } catch (error) {
      this.logger.error('Registration failed', error);

      // Check if it's a Prisma unique constraint error
      if (error.code === 'P2002') {
        throw new ConflictException('Email already registered');
      }

      throw new InternalServerErrorException(
        'Registration failed. Please try again later.',
      );
    }
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    // Check if user is banned
    if (user.isBanned) {
      throw new UnauthorizedException(
        `Account is banned. Reason: ${user.bannedReason || 'No reason provided'}`,
      );
    }

    // Check if email is verified
    if (!user.emailVerified) {
      throw new UnauthorizedException(
        'Please verify your email before logging in',
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    };
  }

  async login(user: any): Promise<AuthResponseDto> {
    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user,
    };
  }

  async refreshToken(refreshToken: string): Promise<{ access_token: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret:
          this.configService.get<string>('JWT_REFRESH_SECRET') ||
          'default-refresh-secret',
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Check if user is banned - revoke token if so
      if (user.isBanned) {
        throw new UnauthorizedException('Account has been banned');
      }

      // Optional: Validate token family for additional security
      // This helps prevent token reuse attacks across devices
      if (
        user.lastRefreshTokenFamily &&
        payload.family !== user.lastRefreshTokenFamily
      ) {
        // Token family mismatch - possible token reuse attack
        this.logger.warn(
          `Possible token reuse attack detected for user ${user.id}`,
        );
        throw new UnauthorizedException(
          'Token reuse detected. Please login again.',
        );
      }

      const access_token = await this.jwtService.signAsync(
        {
          sub: user.id,
          email: user.email,
          role: user.role,
        },
        {
          secret:
            this.configService.get<string>('JWT_SECRET') || 'default-secret',
          expiresIn: '1d',
        },
      );

      return { access_token };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Refresh token has expired');
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async verifyEmail(code: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findFirst({
      where: {
        emailVerificationCode: code,
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid verification code');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    if (
      user.emailVerificationExpiry &&
      new Date() > user.emailVerificationExpiry
    ) {
      throw new BadRequestException('Verification code has expired');
    }

    // Update user
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationCode: null,
        emailVerificationExpiry: null,
      },
    });

    // Send welcome email
    await this.emailService.sendWelcomeEmail(user.email, user.fullName);

    return {
      message: 'Email verified successfully. You can now login.',
    };
  }

  async resendVerification(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    // Generate new verification code
    const emailVerificationCode = this.generateVerificationCode();
    const emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationCode,
        emailVerificationExpiry,
      },
    });

    // Resend email
    await this.emailService.sendVerificationEmail(
      user.email,
      user.fullName,
      emailVerificationCode,
    );

    return {
      message: 'Verification email sent. Please check your inbox.',
    };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Don't reveal if email exists for security
    if (!user) {
      return { message: 'If that email exists, a reset link has been sent.' };
    }

    // Generate reset token (valid for 1 hour, cryptographically strong)
    const passwordResetToken = this.generatePasswordResetToken();
    const passwordResetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken,
        passwordResetExpiry,
      },
    });

    // Send reset email
    await this.emailService.sendEmail(
      user.email,
      'Reset Your Password',
      `
        <h2>Password Reset Request</h2>
        <p>Hi ${user.fullName},</p>
        <p>Click the link below to reset your password:</p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${passwordResetToken}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    );

    return { message: 'If that email exists, a reset link has been sent.' };
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    // Validate new password policy
    const pwValidation = this.validatePasswordPolicy(newPassword);
    if (!pwValidation.valid) {
      throw new BadRequestException({
        message: 'New password does not meet security requirements',
        errors: pwValidation.errors,
      });
    }

    // 🔒 UC_AUTH_03: Single-use token enforcement
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpiry: { gte: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // 🔒 UC_AUTH_03: Update password, clear reset token, and revoke all sessions
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiry: null,
        // Revoke token family to invalidate all existing sessions
        lastRefreshTokenFamily: null,
        lastRefreshIssuedAt: null,
      },
    });

    return { message: 'Password reset successfully' };
  }

  private async generateTokens(user: any) {
    // Generate a unique family ID for token rotation
    const tokenFamily = crypto.randomBytes(16).toString('hex');

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      family: tokenFamily, // Include family for rotation tracking
    };

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret:
          this.configService.get<string>('JWT_SECRET') || 'default-secret',
        expiresIn: '1d',
      }),
      this.jwtService.signAsync(payload, {
        secret:
          this.configService.get<string>('JWT_REFRESH_SECRET') ||
          'default-refresh-secret',
        expiresIn: '7d',
      }),
    ]);

    // Store token family for reuse detection on next refresh
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastRefreshTokenFamily: tokenFamily,
        lastRefreshIssuedAt: new Date(),
      },
    });

    return {
      access_token,
      refresh_token,
    };
  }

  /**
   * Revoke all refresh tokens for a user by clearing token family
   * Called on logout or when user is banned
   */
  async revokeTokenFamily(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        lastRefreshTokenFamily: null,
        lastRefreshIssuedAt: null,
      },
    });
  }
}
