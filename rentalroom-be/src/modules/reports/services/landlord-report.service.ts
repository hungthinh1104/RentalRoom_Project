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

  constructor(private readonly prisma: PrismaService) { }

  /**
   * Get revenue breakdown for a landlord
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

    // Fetch invoices with payments for revenue calculation
    const invoices = await this.prisma.invoice.findMany({
      where: {
        contract: {
          landlordId,
          ...(propertyId ? { room: { propertyId } } : {}),
        },
        deletedAt: null,
        ...(startDate || endDate ? {
          createdAt: {
            ...(startDate ? { gte: new Date(startDate) } : {}),
            ...(endDate ? { lte: new Date(endDate) } : {}),
          }
        } : {}),
      },
      include: {
        payments: {
          where: { status: 'COMPLETED' },
        },
      },
    });

    const monthlyMap = new Map<string, MonthlyRevenueDto>();

    for (const inv of invoices) {
      const date = new Date(inv.createdAt);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const key = `${year}-${month}`;

      let data = monthlyMap.get(key);
      if (!data) {
        data = {
          year,
          month,
          totalRevenue: 0,
          paidAmount: 0,
          pendingAmount: 0,
          overdueAmount: 0,
          invoiceCount: 0,
          paymentCount: 0,
        };
        monthlyMap.set(key, data);
      }

      data.invoiceCount++;
      data.totalRevenue += Number(inv.totalAmount);

      const paidForInvoice = inv.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      data.paidAmount += paidForInvoice;
      data.paymentCount += inv.payments.length;

      if (inv.status === 'PENDING') {
        data.pendingAmount += Number(inv.totalAmount) - paidForInvoice;
      } else if (inv.status === 'OVERDUE') {
        data.overdueAmount += Number(inv.totalAmount) - paidForInvoice;
      }
    }

    const monthlyData = Array.from(monthlyMap.values()).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });

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

    // Fetch properties with room data
    const propertiesData = await this.prisma.property.findMany({
      where: { landlordId, deletedAt: null },
      include: {
        rooms: {
          where: { deletedAt: null },
          select: {
            id: true,
            status: true,
            pricePerMonth: true,
          }
        },
      },
      orderBy: { name: 'asc' }
    });

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // Fetch maintenance requests for these properties in the time period
    const maintenanceCounts = await this.prisma.maintenanceRequest.groupBy({
      by: ['roomId'],
      _count: true,
      where: {
        room: { property: { landlordId } },
        requestDate: { gte: startDate }
      }
    });

    const maintenanceMap = new Map<string, number>();
    maintenanceCounts.forEach(c => maintenanceMap.set(c.roomId, c._count));

    const results: PropertyMetricsDto[] = [];

    for (const prop of propertiesData) {
      const totalRooms = prop.rooms.length;
      const occupiedRooms = prop.rooms.filter(r => r.status === 'OCCUPIED').length;
      const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

      const avgRoomPrice = totalRooms > 0
        ? prop.rooms.reduce((s, r) => s + Number(r.pricePerMonth), 0) / totalRooms
        : 0;

      // Revenue for this property in the given period
      const revenueAgg = await this.prisma.payment.aggregate({
        where: {
          status: 'COMPLETED',
          paidAt: { gte: startDate },
          invoice: {
            contract: {
              room: { propertyId: prop.id }
            }
          }
        },
        _sum: { amount: true }
      });

      const totalRevenue = Number(revenueAgg._sum.amount || 0);

      // Maintenance count for all rooms in property
      let propertyMaintenance = 0;
      prop.rooms.forEach(r => {
        propertyMaintenance += maintenanceMap.get(r.id) || 0;
      });

      results.push({
        propertyId: prop.id,
        propertyName: prop.name,
        totalRooms,
        occupiedRooms,
        occupancyRate,
        totalRevenue,
        averageRoomPrice: avgRoomPrice,
        maintenanceRequests: propertyMaintenance,
      });
    }

    // Sort by occupancy and revenue
    results.sort((a, b) => b.occupancyRate - a.occupancyRate || b.totalRevenue - a.totalRevenue);

    // Calculate summary
    const totalProperties = results.length;
    const averageOccupancy =
      totalProperties > 0
        ? results.reduce((sum, p) => sum + p.occupancyRate, 0) / totalProperties
        : 0;
    const totalRevenue = results.reduce((sum, p) => sum + p.totalRevenue, 0);

    const bestPerformingProperty =
      results.length > 0
        ? {
          id: results[0].propertyId,
          name: results[0].propertyName,
          occupancyRate: results[0].occupancyRate,
        }
        : null;

    return {
      properties: results,
      summary: {
        totalProperties,
        averageOccupancy,
        totalRevenue,
        bestPerformingProperty,
      },
    };
  }

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

    // Fetch active contracts for this landlord/property to identify current tenants
    const contracts = await this.prisma.contract.findMany({
      where: {
        landlordId,
        ...(propertyId ? { room: { propertyId } } : {}),
        deletedAt: null,
      },
      include: {
        tenant: true,
        room: {
          include: {
            property: true,
            _count: {
              select: { maintenanceRequests: true }
            }
          },
        },
        invoices: {
          include: {
            payments: {
              where: { status: 'COMPLETED' },
            },
          },
        },
      },
    }) as any[]; // Use any[] for the loop to avoid strict typing issues with complex includes for now

    const results: TenantBehaviorDto[] = [];

    for (const contract of contracts) {
      const filteredInvoices = contract.invoices;
      const totalPayments = filteredInvoices.length;
      let onTimePayments = 0;
      let latePayments = 0;
      let totalDelay = 0;

      filteredInvoices.forEach(inv => {
        const payment = inv.payments[0]; // Assuming one completed payment per invoice for this logic
        if (payment && payment.paidAt) {
          const paidDate = new Date(payment.paidAt);
          const dueDate = new Date(inv.dueDate);

          if (paidDate <= dueDate) {
            onTimePayments++;
          } else {
            latePayments++;
            const diffDays = Math.ceil((paidDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
            totalDelay += diffDays;
          }
        } else if (inv.status === 'OVERDUE') {
          latePayments++;
        }
      });

      const avgDelay = totalPayments > 0 ? totalDelay / totalPayments : 0;

      results.push({
        tenantId: contract.tenantId,
        tenantName: contract.tenant.fullName,
        propertyName: contract.room.property.name,
        roomNumber: contract.room.roomNumber,
        contractStartDate: contract.startDate.toISOString(),
        totalPayments,
        onTimePayments,
        latePayments,
        averagePaymentDelay: avgDelay,
        maintenanceRequests: contract.room._count.maintenanceRequests,
      });
    }

    // Sort by on-time rate
    results.sort((a, b) => {
      const rateA = a.totalPayments > 0 ? a.onTimePayments / a.totalPayments : 0;
      const rateB = b.totalPayments > 0 ? b.onTimePayments / b.totalPayments : 0;
      return rateB - rateA;
    });

    // Calculate summary
    const totalTenants = results.length;
    const averageOnTimeRate =
      totalTenants > 0
        ? (results.reduce(
          (sum, t) => sum + (t.totalPayments > 0 ? t.onTimePayments / t.totalPayments : 0),
          0,
        ) /
          totalTenants) *
        100
        : 0;

    const averagePaymentDelay =
      totalTenants > 0
        ? results.reduce((sum, t) => sum + t.averagePaymentDelay, 0) / totalTenants
        : 0;

    const totalMaintenanceRequests = results.reduce(
      (sum, t) => sum + t.maintenanceRequests,
      0,
    );

    return {
      tenants: results,
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
  /**
   * Get expense report for a landlord
   * Aggregates data from Expense entries and MaintenanceRequests
   */
  async getLandlordExpenses(
    landlordId: string,
    query: { startDate?: string; endDate?: string },
  ) {
    const { startDate, endDate } = query;

    // Verify landlord exists
    const landlord = await this.prisma.landlord.findUnique({
      where: { userId: landlordId },
    });

    if (!landlord) {
      throw new NotFoundException(`Landlord ${landlordId} not found`);
    }

    const start = startDate ? new Date(startDate) : new Date(0); // Epoch if no start
    const end = endDate ? new Date(endDate) : new Date();

    // 1. Get explicit expenses (Tax, Utilities, etc.) linked to RentalUnits owned by landlord
    const expenses = await this.prisma.expense.groupBy({
      by: ['expenseType'],
      _sum: { amount: true },
      where: {
        rentalUnit: { landlordId },
        paidAt: { gte: start, lte: end },
        deletedAt: null,
      },
    });

    // 2. Get maintenance costs linked to Rooms owned by landlord
    const maintenance = await this.prisma.maintenanceRequest.aggregate({
      _sum: { cost: true },
      where: {
        room: { property: { landlordId } },
        status: 'COMPLETED',
        updatedAt: { gte: start, lte: end }, // Use completion date roughly
      },
    });

    // Format response
    const expenseByType = expenses.map((e) => ({
      type: e.expenseType,
      amount: Number(e._sum.amount || 0),
    }));

    const maintenanceCost = Number(maintenance._sum.cost || 0);
    if (maintenanceCost > 0) {
      expenseByType.push({
        type: 'MAINTENANCE' as any,
        amount: maintenanceCost,
      });
    }

    const totalExpenses = expenseByType.reduce((sum, e) => sum + e.amount, 0);

    return {
      totalExpenses,
      breakdown: expenseByType,
    };
  }
}
