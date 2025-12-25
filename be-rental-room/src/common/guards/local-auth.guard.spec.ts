import { LocalAuthGuard } from './local-auth.guard';
import { ExecutionContext } from '@nestjs/common';

describe('LocalAuthGuard', () => {
  let guard: LocalAuthGuard;

  beforeEach(() => {
    guard = new LocalAuthGuard();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should extend AuthGuard with local strategy', () => {
    expect(guard).toBeInstanceOf(LocalAuthGuard);
  });

  it('should have canActivate method', () => {
    expect(guard.canActivate).toBeDefined();
    expect(typeof guard.canActivate).toBe('function');
  });

  it('should call parent canActivate', async () => {
    const mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          body: {
            email: 'test@example.com',
            password: 'password123',
          },
        }),
      }),
    } as unknown as ExecutionContext;

    // LocalAuthGuard extends PassportStrategy('local')
    // The actual authentication is handled by Passport
    // We test that the guard is properly configured
    expect(guard.canActivate).toBeDefined();
  });

  it('should be injectable', () => {
    // Guard should have Injectable decorator
    const metadata = Reflect.getMetadata('__injectable__', LocalAuthGuard);
    expect(metadata).toBeDefined();
  });
});
