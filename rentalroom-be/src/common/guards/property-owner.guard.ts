import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';

/**
 * Guard to ensure only property owners (or admins) can modify/delete properties
 * Prevents User A from deleting User B's property
 */
@Injectable()
export class PropertyOwnerGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Extract property ID from request params
    const propertyId = request.params.id || request.params.propertyId;

    if (!propertyId) {
      throw new ForbiddenException('Property ID is required');
    }

    if (!user || !user.id) {
      throw new ForbiddenException('User not authenticated');
    }

    // Fetch property to check ownership
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        landlordId: true,
        landlord: {
          select: { userId: true },
        },
      },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    // Allow if user is ADMIN or property owner
    const isAdmin = user.role === 'ADMIN' || user.role === 'SYSTEM';
    const isOwner = property.landlord?.userId === user.id;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException(
        'You do not have permission to access this property',
      );
    }

    return true;
  }
}
