import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import {
  LandlordRevenueQueryDto,
  LandlordRevenueResponseDto,
  PropertyPerformanceQueryDto,
  PropertyPerformanceResponseDto,
  TenantAnalyticsQueryDto,
  TenantAnalyticsResponseDto,
  MonthlyRevenueDto,
  PropertyMetricsDto,
  TenantBehaviorDto,
  LandlordDashboardSummaryQueryDto,
  LandlordDashboardSummaryResponseDto,
} from '../dto/landlord-report.dto';

@Injectable()
export class LandlordReportService {
  private readonly logger = new Logger(LandlordReportService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get revenue report for a landlord
   * Uses materialized view: landlord_revenue_summary
   */
  async getLandlordRevenue(
    query: LandlordRevenueQueryDto,
  ): Promise<LandlordRevenueResponseDto> {
    const { landlordId, startDate, endDate, propertyId } = query;

    // Verify landlord exists
    const landlord = await this.prisma.landlord.findUnique({
      where: { userId: landlordId },
    });

    if (!landlord) {
      throw new NotFoundException(`Landlord ${landlordId} not found`);
    }

    // Query materialized view with filters
    const monthlyData = await this.prisma.$queryRawUnsafe<MonthlyRevenueDto[]>(
      `
      SELECT 
        revenue_year as "year",
        revenue_month as "month",
        total_revenue as "totalRevenue",
        paid_amount as "paidAmount",
        pending_amount as "pendingAmount",
        overdue_amount as "overdueAmount",
        invoice_count as "invoiceCount",
        payment_count as "paymentCount"
      FROM landlord_revenue_summary
      WHERE landlord_id = $1
        ${startDate ? `AND TO_DATE(revenue_year || '-' || revenue_month || '-01', 'YYYY-MM-DD') >= $2` : ''}
        ${endDate ? `AND TO_DATE(revenue_year || '-' || revenue_month || '-01', 'YYYY-MM-DD') <= $3` : ''}
        ${propertyId ? `AND property_id = $4` : ''}
      ORDER BY revenue_year DESC, revenue_month DESC
      `,
      landlordId,
      ...(startDate ? [startDate] : []),
      ...(endDate ? [endDate] : []),
      ...(propertyId ? [propertyId] : []),
    );

    // Calculate summary
    const summary = {
      totalRevenue: monthlyData.reduce(
        (sum, m) => sum + Number(m.totalRevenue),
        0,
      ),
      totalPaid: monthlyData.reduce((sum, m) => sum + Number(m.paidAmount), 0),
      totalPending: monthlyData.reduce(
        (sum, m) => sum + Number(m.pendingAmount),
        0,
      ),
      totalOverdue: monthlyData.reduce(
        (sum, m) => sum + Number(m.overdueAmount),
        0,
      ),
      averageMonthlyRevenue:
        monthlyData.length > 0
          ? monthlyData.reduce((sum, m) => sum + Number(m.totalRevenue), 0) /
            monthlyData.length
          : 0,
    };

    return {
      summary,
      monthlyBreakdown: monthlyData,
    };
  }

  /**
   * Get property performance metrics for a landlord
   * Uses materialized view: property_performance_summary
   */
  async getPropertyPerformance(
    query: PropertyPerformanceQueryDto,
  ): Promise<PropertyPerformanceResponseDto> {
    const { landlordId, months = 6 } = query;

    // Verify landlord exists
    const landlord = await this.prisma.landlord.findUnique({
      where: { userId: landlordId },
    });

    if (!landlord) {
      throw new NotFoundException(`Landlord ${landlordId} not found`);
    }

    // Query materialized view
    const properties = await this.prisma.$queryRawUnsafe<PropertyMetricsDto[]>(
      `
      SELECT 
        property_id as "propertyId",
        property_name as "propertyName",
        total_rooms as "totalRooms",
        occupied_rooms as "occupiedRooms",
        occupancy_rate as "occupancyRate",
        total_revenue as "totalRevenue",
        avg_room_price as "averageRoomPrice",
        maintenance_requests as "maintenanceRequests"
      FROM property_performance_summary
      WHERE landlord_id = $1
        AND calculation_date >= NOW() - INTERVAL '${months} months'
      ORDER BY occupancy_rate DESC, total_revenue DESC
      `,
      landlordId,
    );

    // Calculate summary
    const totalProperties = properties.length;
    const averageOccupancy =
      totalProperties > 0
        ? properties.reduce((sum, p) => sum + Number(p.occupancyRate), 0) /
          totalProperties
        : 0;
    const totalRevenue = properties.reduce(
      (sum, p) => sum + Number(p.totalRevenue),
      0,
    );

    const bestPerformingProperty =
      properties.length > 0
        ? {
            id: properties[0].propertyId,
            name: properties[0].propertyName,
            occupancyRate: Number(properties[0].occupancyRate),
          }
        : null;

    return {
      properties,
      summary: {
        totalProperties,
        averageOccupancy,
        totalRevenue,
        bestPerformingProperty,
      },
    };
  }

  /**
   * Get tenant analytics for a landlord
   * Uses materialized view: tenant_payment_behavior
   */
  async getTenantAnalytics(
    query: TenantAnalyticsQueryDto,
  ): Promise<TenantAnalyticsResponseDto> {
    const { landlordId, propertyId } = query;

    // Verify landlord exists
    const landlord = await this.prisma.landlord.findUnique({
      where: { userId: landlordId },
    });

    if (!landlord) {
      throw new NotFoundException(`Landlord ${landlordId} not found`);
    }

    // Query materialized view
    const tenants = await this.prisma.$queryRawUnsafe<TenantBehaviorDto[]>(
      `
      SELECT 
        t.tenant_id as "tenantId",
        t.tenant_name as "tenantName",
        t.property_name as "propertyName",
        t.room_number as "roomNumber",
        t.contract_start_date as "contractStartDate",
        t.total_payments as "totalPayments",
        t.on_time_payments as "onTimePayments",
        t.late_payments as "latePayments",
        t.avg_payment_delay_days as "averagePaymentDelay",
        t.maintenance_requests as "maintenanceRequests"
      FROM tenant_payment_behavior t
      WHERE t.landlord_id = $1
        ${propertyId ? `AND t.property_id = $2` : ''}
      ORDER BY t.on_time_payment_rate DESC
      `,
      landlordId,
      ...(propertyId ? [propertyId] : []),
    );

    // Calculate summary
    const totalTenants = tenants.length;
    const averageOnTimeRate =
      totalTenants > 0
        ? (tenants.reduce(
            (sum, t) =>
              sum + Number(t.onTimePayments) / Number(t.totalPayments),
            0,
          ) /
            totalTenants) *
          100
        : 0;
    const averagePaymentDelay =
      totalTenants > 0
        ? tenants.reduce((sum, t) => sum + Number(t.averagePaymentDelay), 0) /
          totalTenants
        : 0;
    const totalMaintenanceRequests = tenants.reduce(
      (sum, t) => sum + Number(t.maintenanceRequests),
      0,
    );

    return {
      tenants,
      summary: {
        totalTenants,
        averageOnTimeRate,
        averagePaymentDelay,
        totalMaintenanceRequests,
      },
    };
  }

  /**
   * Lightweight landlord dashboard summary for quick cards
   * No materialized views, pure Prisma for portability
   */
  async getLandlordDashboardSummary(
    query: LandlordDashboardSummaryQueryDto,
  ): Promise<LandlordDashboardSummaryResponseDto> {
    const { landlordId } = query;

    try {
      const landlord = await this.prisma.landlord.findUnique({
        where: { userId: landlordId },
      });
      if (!landlord) {
        this.logger.warn(`Landlord not found: ${landlordId}`);
        throw new NotFoundException(`Landlord ${landlordId} not found`);
      }

      const [
        properties,
        roomsByStatus,
        revenueThisMonthAgg,
        overdueInvoices,
        openMaintenance,
      ] = await Promise.all([
        this.prisma.property.count({ where: { landlordId, deletedAt: null } }),
        this.prisma.room.groupBy({
          by: ['status'],
          _count: true,
          where: { property: { landlordId }, deletedAt: null },
        }),
        // Revenue for current month from completed payments
        (async () => {
          const start = new Date();
          start.setDate(1);
          start.setHours(0, 0, 0, 0);
          const end = new Date(start);
          end.setMonth(end.getMonth() + 1);
          return this.prisma.payment.aggregate({
            where: {
              status: 'COMPLETED',
              invoice: {
                contract: { landlordId },
                issueDate: { gte: start, lt: end },
              },
            },
            _sum: { amount: true },
          });
        })(),
        this.prisma.invoice.count({
          where: {
            status: 'OVERDUE',
            contract: { landlordId },
            deletedAt: null,
          },
        }),
        this.prisma.maintenanceRequest.count({
          where: {
            status: {
              in: ['PENDING', 'IN_PROGRESS'],
            },
            room: { property: { landlordId } },
          },
        }),
      ]);

      const totalRooms = roomsByStatus.reduce((s, r) => s + r._count, 0);
      const occupiedRooms =
        roomsByStatus.find((r) => r.status === 'OCCUPIED')?._count || 0;
      const availableRooms =
        roomsByStatus.find((r) => r.status === 'AVAILABLE')?._count || 0;
      const occupancyRate =
        totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;
      const revenueThisMonth = Number(revenueThisMonthAgg._sum.amount || 0);

      // Last 6 months revenue (completed payments by invoice issue month)
      const now = new Date();
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      const invoices = await this.prisma.invoice.findMany({
        where: {
          contract: { landlordId },
          issueDate: { gte: sixMonthsAgo },
          deletedAt: null,
        },
        include: {
          payments: { where: { status: 'COMPLETED' } },
        },
        orderBy: { issueDate: 'asc' },
      });

      const revenueMap = new Map<
        string,
        { year: number; month: number; amount: number }
      >();
      for (let i = 0; i < 6; i++) {
        const d = new Date(
          sixMonthsAgo.getFullYear(),
          sixMonthsAgo.getMonth() + i,
          1,
        );
        const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
        revenueMap.set(key, {
          year: d.getFullYear(),
          month: d.getMonth() + 1,
          amount: 0,
        });
      }

      invoices.forEach((inv) => {
        const dt = new Date(inv.issueDate);
        const key = `${dt.getFullYear()}-${dt.getMonth() + 1}`;
        const paid = inv.payments.reduce((sum, p) => sum + Number(p.amount), 0);
        const rec = revenueMap.get(key);
        if (rec) rec.amount += paid;
      });

      return {
        summary: {
          totalProperties: properties,
          totalRooms,
          occupiedRooms,
          availableRooms,
          occupancyRate,
          revenueThisMonth,
          overdueInvoices,
          openMaintenance,
        },
        revenueLast6Months: Array.from(revenueMap.values()),
      };
    } catch (err) {
      this.logger.error(
        `Failed to get landlord dashboard summary for ${landlordId}`,
        err,
      );
      if (err instanceof NotFoundException) throw err;
      throw new InternalServerErrorException(
        'Failed to retrieve landlord dashboard summary',
      );
    }
  }
}
