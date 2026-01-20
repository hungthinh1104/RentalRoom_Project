import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Res,
  Query,
  BadRequestException,
  UnauthorizedException,
  HttpStatus,
  HttpCode,
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
import { ForgotPasswordDto, ResetPasswordDto } from './dto/forgot-password.dto';
import { LocalAuthGuard } from 'src/common/guards/local-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Auth } from 'src/common/decorators/auth.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 registrations per hour
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
  @HttpCode(HttpStatus.OK)
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
  @HttpCode(HttpStatus.OK)
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
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 900000 } }) // 5 login attempts per 15 minutes
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
  @HttpCode(HttpStatus.OK)
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

  @Post('session')
  @ApiOperation({
    summary: 'Validate credentials and return user session (for NextAuth)',
  })
  @ApiResponse({ status: 200, description: 'Session data returned' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async session(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{
    id: string;
    email: string;
    name: string;
    role: string;
    access_token: string;
  }> {
    // Validate user credentials
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate backend JWT and set cookie
    // This allows the frontend (port 3000) to make authenticated requests to backend (port 3005)
    // because credentials: "include" sends this cookie.
    const { access_token } = await this.authService.login(user);

    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    // Return user data for NextAuth session
    return {
      id: user.id,
      email: user.email,
      name: user.fullName,
      role: user.role,
      access_token, // Return token so NextAuth can store it
    };
  }

  @Post('logout')
  @Auth()
  async logout(
    @CurrentUser() user: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Clear refresh token family to invalidate all tokens
    await this.authService.revokeTokenFamily(user.id);

    // Clear cookies
    res.clearCookie('refresh_token', { path: '/' });
    res.clearCookie('access_token', { path: '/' });

    return {
      message: 'Logged out successfully',
      statusCode: HttpStatus.OK,
    };
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({
    status: 200,
    description: 'Reset email sent if account exists',
  })
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(
    @Body() dto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }
}
