import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { PrismaService } from 'src/database/prisma/prisma.service';
import { RegisterDto, AuthResponseDto } from './dto/auth.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { EmailService } from 'src/common/services/email.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ message: string }> {
    // Prevent creating admin via public registration
    if ((registerDto.role || '').toString().toUpperCase() === 'ADMIN') {
      throw new ForbiddenException('Cannot create ADMIN via registration');
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
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    try {
      // Use transaction to ensure atomicity
      const user = await this.prisma.$transaction(async (tx) => {
        // Create user
        const newUser = await tx.user.create({
          data: {
            email: registerDto.email,
            passwordHash: hashedPassword,
            fullName: registerDto.fullName,
            phoneNumber: registerDto.phone || '', // Handle null case
            role: (registerDto.role || 'TENANT') as any, // Cast to UserRole enum
            verificationCode,
            verificationExpiry,
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
        verificationCode,
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
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async verifyEmail(code: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findFirst({
      where: { verificationCode: code },
    });

    if (!user) {
      throw new BadRequestException('Invalid verification code');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    if (user.verificationExpiry && new Date() > user.verificationExpiry) {
      throw new BadRequestException('Verification code has expired');
    }

    // Update user
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationCode: null,
        verificationExpiry: null,
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
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        verificationCode,
        verificationExpiry,
      },
    });

    // Resend email
    await this.emailService.sendVerificationEmail(
      user.email,
      user.fullName,
      verificationCode,
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

    // Generate reset token (valid for 1 hour)
    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        verificationCode: resetToken, // Reuse verificationCode field for reset token
        verificationExpiry: resetTokenExpiry,
      },
    });

    // Send reset email
    await this.emailService.sendEmail({
      to: user.email,
      subject: 'Reset Your Password',
      html: `
        <h2>Password Reset Request</h2>
        <p>Hi ${user.fullName},</p>
        <p>Click the link below to reset your password:</p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });

    return { message: 'If that email exists, a reset link has been sent.' };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findFirst({
      where: {
        verificationCode: token,
        verificationExpiry: { gte: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        verificationCode: null,
        verificationExpiry: null,
      },
    });

    return { message: 'Password reset successfully' };
  }

  private async generateTokens(user: any) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
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

    return {
      access_token,
      refresh_token,
    };
  }
}
