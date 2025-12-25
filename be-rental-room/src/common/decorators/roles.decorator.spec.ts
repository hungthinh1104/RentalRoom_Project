import { Reflector } from '@nestjs/core';
import { Roles, ROLES_KEY } from './roles.decorator';

describe('Roles Decorator', () => {
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
  });

  it('should set roles metadata with single role', () => {
    @Roles('admin')
    class TestController {}

    const roles = reflector.get(ROLES_KEY, TestController);
    expect(roles).toEqual(['admin']);
  });

  it('should set roles metadata with multiple roles', () => {
    @Roles('admin', 'landlord', 'tenant')
    class TestController {}

    const roles = reflector.get(ROLES_KEY, TestController);
    expect(roles).toEqual(['admin', 'landlord', 'tenant']);
  });

  it('should set roles metadata on method', () => {
    class TestController {
      @Roles('landlord')
      testMethod() {}
    }

    const roles = reflector.get(ROLES_KEY, TestController.prototype.testMethod);
    expect(roles).toEqual(['landlord']);
  });

  it('should set empty array when called without arguments', () => {
    @Roles()
    class TestController {}

    const roles = reflector.get(ROLES_KEY, TestController);
    expect(roles).toEqual([]);
  });

  it('should export ROLES_KEY constant', () => {
    expect(ROLES_KEY).toBe('roles');
  });
});
