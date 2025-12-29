import {
  Controller,
  Get,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { AdminReportService } from './services/admin-report.service';
import { LandlordReportService } from './services/landlord-report.service';
import { TenantReportService } from './services/tenant-report.service';
import {
  LandlordRevenueQueryDto,
  LandlordRevenueResponseDto,
  PropertyPerformanceQueryDto,
  PropertyPerformanceResponseDto,
  TenantAnalyticsQueryDto,
  TenantAnalyticsResponseDto,
  LandlordDashboardSummaryQueryDto,
  LandlordDashboardSummaryResponseDto,
} from './dto/landlord-report.dto';
import {
  TenantPaymentHistoryQueryDto,
  TenantPaymentHistoryResponseDto,
  TenantExpenseQueryDto,
  TenantExpenseResponseDto,
} from './dto/tenant-report.dto';
import {
  AdminOverviewQueryDto,
  AdminOverviewResponseDto,
  AdminMarketInsightsQueryDto,
  AdminMarketInsightsResponseDto,
  LandlordRatingQueryDto,
  PaginatedLandlordRatingResponseDto,
} from './dto/admin-report.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(
    private readonly adminService: AdminReportService,
    private readonly landlordService: LandlordReportService,
    private readonly tenantService: TenantReportService,
  ) {}

  /**
   * GET /reports/landlord/revenue
   * Get revenue report for landlords
   */
  @Get('landlord/revenue')
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get landlord revenue report',
    description: 'Returns monthly revenue breakdown with summary statistics',
  })
  @ApiResponse({
    status: 200,
    description: 'Revenue report retrieved successfully',
    type: LandlordRevenueResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Landlord not found' })
  async getLandlordRevenue(
    @Query() query: LandlordRevenueQueryDto,
  ): Promise<LandlordRevenueResponseDto> {
    return this.landlordService.getLandlordRevenue(query);
  }

  /**
   * GET /reports/landlord/property-performance
   * Get property performance metrics
   */
  @Get('landlord/property-performance')
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get property performance metrics',
    description:
      'Returns occupancy rates, revenue, and maintenance data per property',
  })
  @ApiResponse({
    status: 200,
    description: 'Property performance report retrieved successfully',
    type: PropertyPerformanceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Landlord not found' })
  async getPropertyPerformance(
    @Query() query: PropertyPerformanceQueryDto,
  ): Promise<PropertyPerformanceResponseDto> {
    return this.landlordService.getPropertyPerformance(query);
  }

  /**
   * GET /reports/landlord/tenant-analytics
   * Get tenant behavior analytics
   */
  @Get('landlord/tenant-analytics')
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get tenant behavior analytics',
    description:
      'Returns payment history and maintenance request patterns per tenant',
  })
  @ApiResponse({
    status: 200,
    description: 'Tenant analytics retrieved successfully',
    type: TenantAnalyticsResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Landlord not found' })
  async getTenantAnalytics(
    @Query() query: TenantAnalyticsQueryDto,
  ): Promise<TenantAnalyticsResponseDto> {
    return this.landlordService.getTenantAnalytics(query);
  }

  /**
   * GET /reports/tenant/payment-history
   * Get payment history for tenants
   */
  @Get('tenant/payment-history')
  @Roles(UserRole.TENANT, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get tenant payment history',
    description:
      'Returns paginated payment records with on-time/late statistics',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment history retrieved successfully',
    type: TenantPaymentHistoryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async getTenantPaymentHistory(
    @Query() query: TenantPaymentHistoryQueryDto,
  ): Promise<TenantPaymentHistoryResponseDto> {
    return this.tenantService.getTenantPaymentHistory(query);
  }

  /**
   * GET /reports/tenant/expenses
   * Get expense tracking for tenants
   */
  @Get('tenant/expenses')
  @Roles(UserRole.TENANT, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get tenant expense tracking',
    description:
      'Returns monthly expense breakdown by category (rent, utilities, services)',
  })
  @ApiResponse({
    status: 200,
    description: 'Expense report retrieved successfully',
    type: TenantExpenseResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async getTenantExpenses(
    @Query() query: TenantExpenseQueryDto,
  ): Promise<TenantExpenseResponseDto> {
    return this.tenantService.getTenantExpenses(query);
  }

  /**
   * GET /reports/admin/overview
   * Get platform overview for admins
   */
  @Get('admin/overview')
  @Roles(UserRole.ADMIN)
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300) // Cache for 5 minutes
  @ApiOperation({
    summary: 'Get platform overview (Admin only)',
    description: 'Returns platform statistics, trends, and top performers',
  })
  @ApiResponse({
    status: 200,
    description: 'Platform overview retrieved successfully',
    type: AdminOverviewResponseDto,
  })
  async getAdminOverview(
    @Query() query: AdminOverviewQueryDto,
  ): Promise<AdminOverviewResponseDto> {
    return this.adminService.getAdminOverview(query);
  }

  /**
   * GET /reports/admin/market-insights
   * Get market insights for admins
   */
  @Get('admin/market-insights')
  @Roles(UserRole.ADMIN)
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(3600) // Cache for 1 hour
  @ApiOperation({
    summary: 'Get market insights (Admin only)',
    description: 'Returns price analysis, popular searches, and demand metrics',
  })
  @ApiResponse({
    status: 200,
    description: 'Market insights retrieved successfully',
    type: AdminMarketInsightsResponseDto,
  })
  async getAdminMarketInsights(
    @Query() query: AdminMarketInsightsQueryDto,
  ): Promise<AdminMarketInsightsResponseDto> {
    return this.adminService.getAdminMarketInsights(query);
  }

  /**
   * GET /reports/landlord/summary
   * Lightweight dashboard summary for landlord cards
   */
  @Get('landlord/summary')
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60) // Cache for 1 minute
  @ApiOperation({ summary: 'Get landlord dashboard summary' })
  @ApiResponse({
    status: 200,
    description: 'Summary retrieved',
    type: LandlordDashboardSummaryResponseDto,
  })
  async getLandlordSummary(
    @Query() query: LandlordDashboardSummaryQueryDto,
  ): Promise<LandlordDashboardSummaryResponseDto> {
    return this.landlordService.getLandlordDashboardSummary(query);
  }

  /**
   * GET /reports/admin/ratings
   * Get landlord ratings for admin
   */
  @Get('admin/ratings')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get landlord ratings',
    description: 'Returns aggregated ratings and reviews for all landlords',
  })
  @ApiResponse({
    status: 200,
    description: 'Ratings retrieved successfully',
    type: PaginatedLandlordRatingResponseDto,
  })
  async getLandlordRatings(
    @Query() query: LandlordRatingQueryDto,
  ): Promise<PaginatedLandlordRatingResponseDto> {
    return this.adminService.getLandlordRatings(
      query.page,
      query.limit,
      query.search,
    );
  }
}
