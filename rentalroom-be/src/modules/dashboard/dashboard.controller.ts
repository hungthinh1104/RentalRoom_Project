import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { DashboardService } from './dashboard.service';

/**
 * Dashboard Controller - Survival Feature #1
 * Cash Flow at a Glance for Landlords
 */
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('cash-flow')
  @Roles('LANDLORD', 'ADMIN')
  async getCashFlow(@CurrentUser() user: any, @Query('month') month?: string) {
    const targetMonth = month || new Date().toISOString().slice(0, 7); // YYYY-MM
    return this.dashboardService.getCashFlowSummary(user.id, targetMonth);
  }

  @Get('stats')
  @Roles('LANDLORD', 'ADMIN')
  async getStats(@CurrentUser() user: any) {
    return this.dashboardService.getLandlordStats(user.id);
  }

  /**
   * Admin Endpoints
   */
  @Get('admin/overview')
  @Roles('ADMIN')
  async getAdminOverview() {
    return this.dashboardService.getAdminOverview();
  }

  @Get('admin/top-performers')
  @Roles('ADMIN')
  async getTopPerformers() {
    return this.dashboardService.getTopPerformers();
  }
}
