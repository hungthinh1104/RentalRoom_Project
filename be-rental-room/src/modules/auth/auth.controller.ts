import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Res,
  Query,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, AuthResponseDto, LoginDto } from './dto/auth.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { LocalAuthGuard } from 'src/common/guards/local-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered. Verification email sent.',
  })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async register(@Body() dto: RegisterDto): Promise<{ message: string }> {
    return this.authService.register(dto);
  }

  @Post('verify')
  @SkipThrottle() // Bypass global throttling for verification endpoint
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // Local limit if throttling is enabled elsewhere
  @ApiOperation({ summary: 'Verify email with verification code' })
  @ApiQuery({
    name: 'code',
    required: true,
    description: '6-digit verification code',
  })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired verification code',
  })
  async verifyEmail(@Query('code') code: string): Promise<{ message: string }> {
    return this.authService.verifyEmail(code);
  }

  @Post('resend-verification')
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 attempts per minute
  @ApiOperation({ summary: 'Resend verification email' })
  @ApiResponse({ status: 200, description: 'Verification email sent' })
  @ApiResponse({
    status: 400,
    description: 'User not found or already verified',
  })
  @ApiBody({ type: ResendVerificationDto })
  async resendVerification(@Body() dto: unknown): Promise<{ message: string }> {
    // Accept either an object with { email } (preferred) or a raw email string for backwards compatibility
    const email =
      typeof dto === 'string' ? dto : (dto as { email?: string })?.email;

    if (!email) {
      throw new BadRequestException('Email is required');
    }

    return this.authService.resendVerification(email);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Successfully logged in',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials or email not verified',
  })
  async login(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Omit<AuthResponseDto, 'refresh_token'>> {
    const result = await this.authService.login(req.user);

    // Set refresh token as HttpOnly cookie (7 days)
    const refreshToken = (result as any).refresh_token;
    if (refreshToken) {
      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });
    }

    // Return the rest (access token + user)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { refresh_token, ...rest } = result as any;
    return rest as Omit<AuthResponseDto, 'refresh_token'>;
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(@Req() req: Request): Promise<{ access_token: string }> {
    // Prefer refresh token from body, fall back to HttpOnly cookie (if present)
    const body = (req as any)?.body || {};
    const token =
      body.refresh_token ||
      ((req as any)?.cookies && (req as any).cookies.refresh_token);
    if (!token) {
      throw new BadRequestException('Refresh token is required');
    }
    return this.authService.refreshToken(token);
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('refresh_token', { path: '/' });
    return { message: 'Logged out' };
  }
}
