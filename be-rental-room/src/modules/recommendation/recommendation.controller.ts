import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { RecommendationService } from './recommendation.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../modules/users/entities/user.entity';

@ApiTags('Recommendations')
@Controller('recommendations')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class RecommendationController {
    constructor(private readonly recommendationService: RecommendationService) { }

    @Get()
    @Roles(UserRole.TENANT)
    @ApiOperation({ summary: 'Get personalized room recommendations' })
    async getRecommendations(@CurrentUser() user: User) {
        // Assuming the user object has the tenant's ID or we look it up.
        // However, the CurrentUser decorator usually returns the User entity.
        // We might need to find the tenant associated with this user.
        // For simplicity here, assuming the service handles the user ID lookup or we pass user.id if tenant table uses same ID or linked.
        // Actually, usually Tenant table has userId. But let's pass user.id and let service find the tenant record if needed,
        // OR if we assume tenantId is NOT same as userId, we need to look it up.
        // BUT looking at other modules (e.g. FavoritesService), it takes tenantId.
        // Let's assume for now we pass user.id and in logic we might need to fix if tenantId != userId.
        // Let's check how other modules get tenantId from user.
        // Usually via the TenantService or by including it in the JWT payload/user object.
        // Let's rely on finding tenant by userId in the service if needed, OR just pass userId and fix later.
        // Wait, FavoritesService `toggleFavorite(tenantId...)`.
        // In `ContractsController` -> `user: User`.
        // Let's inspect how tenantId is derived.

        // For now, let's look up tenantId from userId in the service for safety, 
        // OR just search favorites by `where: { tenant: { userId: user.id } }` if prisma allows.
        // BUT `FavoriteRoom` has `tenantId`.
        // So let's update service to find tenant first.

        return this.recommendationService.getPersonalized(user.id);
    }
}
