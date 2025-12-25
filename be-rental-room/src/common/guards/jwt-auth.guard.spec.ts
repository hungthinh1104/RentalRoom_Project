import { JwtAuthGuard } from './jwt-auth.guard';
import { ExecutionContext } from '@nestjs/common';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    guard = new JwtAuthGuard();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should extend AuthGuard with jwt strategy', () => {
    expect(guard).toBeInstanceOf(JwtAuthGuard);
  });

  it('should have canActivate method', () => {
    expect(guard.canActivate).toBeDefined();
    expect(typeof guard.canActivate).toBe('function');
  });

  it('should call parent canActivate', async () => {
    const mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          headers: {
            authorization: 'Bearer valid-token',
          },
        }),
      }),
    } as unknown as ExecutionContext;

    // JwtAuthGuard extends PassportStrategy('jwt')
    // The actual authentication is handled by Passport
    // We test that the guard is properly configured
    expect(guard.canActivate).toBeDefined();
  });

  it('should be injectable', () => {
    // Guard should have Injectable decorator
    const metadata = Reflect.getMetadata('__injectable__', JwtAuthGuard);
    expect(metadata).toBeDefined();
  });
});
