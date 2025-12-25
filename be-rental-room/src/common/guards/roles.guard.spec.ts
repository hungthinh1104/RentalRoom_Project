import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from '../decorators/roles.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;
  let mockExecutionContext: ExecutionContext;
  let mockRequest: any;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);

    mockRequest = {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        role: 'tenant',
      },
    };

    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access when no roles are required (undefined)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const result = guard.canActivate(mockExecutionContext);
    expect(result).toBe(true);
  });

  // [ĐÃ SỬA]: Code mới của bạn cho phép mảng rỗng pass qua
  it('should allow access when required roles array is empty', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);
    const result = guard.canActivate(mockExecutionContext);
    expect(result).toBe(true);
  });

  it('should allow access when user has required role', () => {
    mockRequest.user.role = 'admin';
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
    const result = guard.canActivate(mockExecutionContext);
    expect(result).toBe(true);
  });

  it('should allow access when user has one of multiple required roles', () => {
    mockRequest.user.role = 'landlord';
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['admin', 'landlord']);
    const result = guard.canActivate(mockExecutionContext);
    expect(result).toBe(true);
  });

  it('should deny access when user does not have required role', () => {
    mockRequest.user.role = 'tenant';
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
    const result = guard.canActivate(mockExecutionContext);
    expect(result).toBe(false);
  });

  // [ĐÃ SỬA]: Đổi tên thành "case-insensitive" và expect true
  it('should be case-insensitive (allow access even if case differs)', () => {
    mockRequest.user.role = 'Admin'; // Hoa
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']); // Thường

    const result = guard.canActivate(mockExecutionContext);

    // Code guard của bạn có .toUpperCase() nên cái này phải là TRUE
    expect(result).toBe(true);
  });

  // [THÊM MỚI]: Test case quan trọng cho code Defensive (bảo vệ) của bạn
  it('should deny access safely if user is undefined (missing AuthGuard)', () => {
    mockRequest.user = undefined; // Giả lập trường hợp quên AuthGuard
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);

    const result = guard.canActivate(mockExecutionContext);

    expect(result).toBe(false); // Không được crash, trả về false
  });
});
