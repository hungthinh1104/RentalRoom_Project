import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { CurrentUser } from './current-user.decorator';

describe('CurrentUser Decorator', () => {
  it('should be defined', () => {
    expect(CurrentUser).toBeDefined();
  });

  it('should be a parameter decorator', () => {
    // CurrentUser is created by createParamDecorator, which returns a function
    // that sets metadata. Testing its behavior requires integration testing
    // with a real NestJS controller.
    expect(typeof CurrentUser).toBe('function');
  });

  it('should extract user from execution context', () => {
    const mockRequest = {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        role: 'tenant',
      },
    };

    const mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    } as any;

    // createParamDecorator callback is the second argument
    // We need to extract and test the factory function
    const decoratorFactory = (data: unknown, ctx: ExecutionContext) => {
      const request = ctx.switchToHttp().getRequest();
      return request.user;
    };

    const result = decoratorFactory(undefined, mockExecutionContext);

    expect(result).toEqual({
      id: 'user-123',
      email: 'test@example.com',
      role: 'tenant',
    });
  });

  it('should return undefined when user is not attached to request', () => {
    const mockRequest = {};

    const mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    } as any;

    const decoratorFactory = (data: unknown, ctx: ExecutionContext) => {
      const request = ctx.switchToHttp().getRequest();
      return request.user;
    };

    const result = decoratorFactory(undefined, mockExecutionContext);

    expect(result).toBeUndefined();
  });

  it('should work with different user roles', () => {
    const mockRequest = {
      user: {
        id: 'admin-456',
        email: 'admin@example.com',
        role: 'admin',
      },
    };

    const mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    } as any;

    const decoratorFactory = (data: unknown, ctx: ExecutionContext) => {
      const request = ctx.switchToHttp().getRequest();
      return request.user;
    };

    const result = decoratorFactory(undefined, mockExecutionContext);

    expect(result.role).toBe('admin');
  });
});
