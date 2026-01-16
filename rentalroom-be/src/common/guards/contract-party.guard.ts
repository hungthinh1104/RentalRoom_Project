import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';

/**
 * Guard to ensure only contract parties (landlord or tenant) can access contract
 * Prevents unauthorized access to sensitive contract data
 */
@Injectable()
export class ContractPartyGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const contractId = request.params.id || request.params.contractId;

    if (!contractId) {
      throw new ForbiddenException('Contract ID is required');
    }

    if (!user || !user.id) {
      throw new ForbiddenException('User not authenticated');
    }

    // Fetch contract with landlord and tenant info
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      select: {
        room: {
          select: {
            property: {
              select: {
                landlord: {
                  select: { userId: true },
                },
              },
            },
          },
        },
        tenant: {
          select: { userId: true },
        },
      },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    // Allow if user is ADMIN, landlord, or tenant
    const isAdmin = user.role === 'ADMIN' || user.role === 'SYSTEM';
    const isLandlord = contract.room?.property?.landlord?.userId === user.id;
    const isTenant = contract.tenant?.userId === user.id;

    if (!isAdmin && !isLandlord && !isTenant) {
      throw new ForbiddenException('You are not a party to this contract');
    }

    return true;
  }
}
