import { validate } from 'class-validator';
import {
  LoginDto,
  RegisterDto,
  RefreshTokenDto,
  AuthResponseDto,
} from './auth.dto';
import { UserRole } from '@prisma/client';

describe('Auth DTOs', () => {
  describe('LoginDto', () => {
    it('should validate a valid login DTO', async () => {
      const dto = new LoginDto();
      dto.email = 'test@example.com';
      dto.password = 'password123';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail with invalid email', async () => {
      const dto = new LoginDto();
      dto.email = 'invalid-email';
      dto.password = 'password123';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('email');
    });

    it('should fail with empty email', async () => {
      const dto = new LoginDto();
      dto.email = '';
      dto.password = 'password123';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('email');
    });

    it('should fail with empty password', async () => {
      const dto = new LoginDto();
      dto.email = 'test@example.com';
      dto.password = '';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('password');
    });

    it('should fail with password less than 6 characters', async () => {
      const dto = new LoginDto();
      dto.email = 'test@example.com';
      dto.password = '12345';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('password');
    });
  });

  describe('RegisterDto', () => {
    it('should validate a valid register DTO with TENANT role', async () => {
      const dto = new RegisterDto();
      dto.fullName = 'John Doe';
      dto.email = 'test@example.com';
      dto.password = 'password123';
      dto.phone = '0901234567';
      dto.role = UserRole.TENANT;

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should validate a valid register DTO with LANDLORD role', async () => {
      const dto = new RegisterDto();
      dto.fullName = 'Jane Doe';
      dto.email = 'landlord@example.com';
      dto.password = 'password123';
      dto.phone = '0901234567';
      dto.role = UserRole.LANDLORD;

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail with missing role', async () => {
      const dto = new RegisterDto();
      dto.fullName = 'John Doe';
      dto.email = 'test@example.com';
      dto.password = 'password123';
      dto.phone = '0901234567';
      // role is missing

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const roleError = errors.find((err) => err.property === 'role');
      expect(roleError).toBeDefined();
    });

    it('should fail with invalid role', async () => {
      const dto = new RegisterDto();
      dto.fullName = 'John Doe';
      dto.email = 'test@example.com';
      dto.password = 'password123';
      dto.phone = '0901234567';
      (dto as any).role = 'INVALID_ROLE';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const roleError = errors.find((err) => err.property === 'role');
      expect(roleError).toBeDefined();
      expect(roleError?.constraints).toHaveProperty('isEnum');
    });

    it('should fail with empty fullName', async () => {
      const dto = new RegisterDto();
      dto.fullName = '';
      dto.email = 'test@example.com';
      dto.password = 'password123';
      dto.phone = '0901234567';
      dto.role = UserRole.TENANT;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('fullName');
    });

    it('should fail with invalid email', async () => {
      const dto = new RegisterDto();
      dto.fullName = 'John Doe';
      dto.email = 'invalid-email';
      dto.password = 'password123';
      dto.phone = '0901234567';
      dto.role = UserRole.TENANT;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('email');
    });

    it('should fail with short password', async () => {
      const dto = new RegisterDto();
      dto.fullName = 'John Doe';
      dto.email = 'test@example.com';
      dto.password = '123';
      dto.phone = '0901234567';
      dto.role = UserRole.TENANT;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('password');
    });

    it('should fail with empty phone', async () => {
      const dto = new RegisterDto();
      dto.fullName = 'John Doe';
      dto.email = 'test@example.com';
      dto.password = 'password123';
      dto.phone = '';
      dto.role = UserRole.TENANT;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('phone');
    });

    it('should fail with missing required fields', async () => {
      const dto = new RegisterDto();

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      // Should have errors for all required fields (fullName, email, password, phone, role)
      expect(errors.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('RefreshTokenDto', () => {
    it('should validate a valid refresh token DTO', async () => {
      const dto = new RefreshTokenDto();
      dto.refresh_token = 'valid-refresh-token';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail with empty refresh_token', async () => {
      const dto = new RefreshTokenDto();
      dto.refresh_token = '';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('refresh_token');
    });

    it('should fail with non-string refresh_token', async () => {
      const dto = new RefreshTokenDto();
      (dto as any).refresh_token = 12345;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('AuthResponseDto', () => {
    it('should create a valid auth response DTO', () => {
      const dto = new AuthResponseDto();
      dto.access_token = 'access-token';
      dto.refresh_token = 'refresh-token';
      dto.user = {
        id: 'user-123',
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'TENANT',
      };

      expect(dto.access_token).toBe('access-token');
      expect(dto.refresh_token).toBe('refresh-token');
      expect(dto.user.id).toBe('user-123');
      expect(dto.user.email).toBe('test@example.com');
    });

    it('should have correct structure', () => {
      const dto = new AuthResponseDto();
      dto.access_token = 'token1';
      dto.refresh_token = 'token2';
      dto.user = {
        id: '1',
        email: 'user@test.com',
        fullName: 'User',
        role: 'LANDLORD',
      };

      expect(dto).toHaveProperty('access_token');
      expect(dto).toHaveProperty('refresh_token');
      expect(dto).toHaveProperty('user');
      expect(dto.user).toHaveProperty('id');
      expect(dto.user).toHaveProperty('email');
      expect(dto.user).toHaveProperty('fullName');
      expect(dto.user).toHaveProperty('role');
    });
  });
});
