import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    // Check null safety
    if (!user || !user.role) {
      this.logger.warn(
        'Access denied: User not found or has no role (Missing AuthGuard?)',
      );
      return false;
    }

    // --- KHÔI PHỤC LOGIC NORMALIZE (Để test case 'Admin' vs 'admin' chạy đúng) ---
    // Chuyển tất cả về chữ HOA để so sánh
    const userRoleNormalized = user.role.toString().toUpperCase();
    const requiredRolesNormalized = requiredRoles.map((role) =>
      role.toString().toUpperCase(),
    );

    const allowed = requiredRolesNormalized.includes(userRoleNormalized);
    // -----------------------------------------------------------------------------

    if (!allowed) {
      this.logger.verbose(
        `Access denied for user ${user.email} (ID: ${user.id}): role=${user.role}, required=[${requiredRoles.join(',')}]`,
      );
    }

    return allowed;
  }
}
