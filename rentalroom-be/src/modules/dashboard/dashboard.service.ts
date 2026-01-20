import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { InvoiceStatus } from '../billing/entities';
import { ContractStatus } from '@prisma/client';

export interface CashFlowAlert {
  type: 'overdue' | 'upcoming' | 'forecast' | 'success';
  severity: 'high' | 'medium' | 'low';
  invoiceId?: string;
  roomNumber?: string;
  amount?: number;
  days?: number;
  message: string;
}

/**
 * Dashboard Service - Survival Feature #1
 * Provides financial overview for landlords
 */
@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly prisma: PrismaService) { }

  /**
   * Get Cash Flow Summary - Core Survival Feature
   */
  async getCashFlowSummary(landlordId: string, month: string) {
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0, 23, 59, 59);

    // 1. Get all invoices for this month
    const invoices = await this.prisma.invoice.findMany({
      where: {
        contract: {
          landlordId,
        },
        issueDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        contract: {
          include: {
            room: true,
          },
        },
      },
    });

    // 2. Calculate totals
    const totalIncome = invoices.reduce((sum, inv) => {
      if (inv.status === InvoiceStatus.PAID) {
        return sum + Number(inv.totalAmount || 0);
      }
      return sum;
    }, 0);

    const totalExpected = invoices.reduce(
      (sum, inv) => sum + Number(inv.totalAmount || 0),
      0,
    );

    const totalPending = invoices.reduce((sum, inv) => {
      if (inv.status === InvoiceStatus.PENDING) {
        return sum + Number(inv.totalAmount || 0);
      }
      return sum;
    }, 0);

    // Helper predicate for overdue
    const isOverdue = (inv: any) =>
      inv.status === InvoiceStatus.OVERDUE ||
      (inv.status === InvoiceStatus.PENDING &&
        new Date(inv.dueDate) < new Date());

    const totalOverdue = invoices.reduce((sum, inv) => {
      if (isOverdue(inv)) {
        return sum + Number(inv.totalAmount || 0);
      }
      return sum;
    }, 0);

    // 3. Expenses (MVP: simplified for now)
    // 3. Expenses
    const expenses = await this.prisma.operationalExpense.findMany({
      where: {
        landlordId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const totalExpense = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

    // 4. Calculate balance
    const balance = totalIncome - totalExpense;

    // 5. Generate alerts
    const alerts: CashFlowAlert[] = [];

    // Overdue payments
    const overdueInvoices = invoices.filter(isOverdue);

    for (const inv of overdueInvoices.slice(0, 5)) {
      const daysOverdue = Math.floor(
        (new Date().getTime() - new Date(inv.dueDate).getTime()) /
        (1000 * 60 * 60 * 24),
      );
      alerts.push({
        type: 'overdue',
        severity: daysOverdue > 7 ? 'high' : 'medium',
        invoiceId: inv.id,
        roomNumber: inv.contract.room.roomNumber,
        amount: Number(inv.totalAmount),
        days: daysOverdue,
        message: `Phòng ${inv.contract.room.roomNumber} chưa thanh toán (quá ${daysOverdue} ngày)`,
      });
    }

    // Upcoming payments (due in 3 days)
    const upcomingInvoices = invoices.filter((inv) => {
      const daysUntilDue =
        (new Date(inv.dueDate).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24);
      return (
        inv.status === InvoiceStatus.PENDING &&
        daysUntilDue >= 0 &&
        daysUntilDue <= 3
      );
    });

    for (const inv of upcomingInvoices.slice(0, 3)) {
      alerts.push({
        type: 'upcoming',
        severity: 'low',
        invoiceId: inv.id,
        roomNumber: inv.contract.room.roomNumber,
        amount: Number(inv.totalAmount),
        message: `Phòng ${inv.contract.room.roomNumber} sắp đến hạn thanh toán`,
      });
    }

    // Paid on time (success stories)
    const paidOnTime = invoices.filter(
      (inv) =>
        inv.status === InvoiceStatus.PAID &&
        inv.paidAt &&
        new Date(inv.paidAt) <= new Date(inv.dueDate),
    );

    if (paidOnTime.length > 0) {
      alerts.push({
        type: 'success',
        severity: 'low',
        message: `${paidOnTime.length} phòng đã thanh toán đúng hạn`,
      });
    }

    // Cash flow forecast
    // Corrected logic: "Forecast" here means expected outcome for this month
    const forecast = totalExpected - totalExpense;
    if (forecast < 0) {
      alerts.push({
        type: 'forecast',
        severity: 'high',
        amount: Math.abs(forecast),
        message: `Dự kiến thâm hụt tháng này: ${Math.abs(forecast).toLocaleString('vi-VN')} VNĐ`,
      });
    }

    return {
      month,
      totalIncome,
      totalExpense,
      totalExpected,
      totalPending,
      totalOverdue,
      balance,
      alerts,
      invoiceCount: invoices.length,
      paidCount: invoices.filter((i) => i.status === InvoiceStatus.PAID).length,
      overdueCount: overdueInvoices.length,
    };
  }

  /**
   * Get Landlord Statistics
   */
  async getLandlordStats(landlordId: string) {
    // Get properties for this landlord
    const properties = await this.prisma.property.findMany({
      where: { landlordId },
      include: {
        rooms: true,
      },
    });

    if (!properties || properties.length === 0) {
      return null;
    }

    // Count totals
    const totalProperties = properties.length;
    const totalRooms = properties.reduce((sum, p) => sum + p.rooms.length, 0);

    // Count occupied rooms (rooms with at least one ACTIVE contract)
    const occupiedRoomsCount = await this.prisma.room.count({
      where: {
        property: { landlordId },
        contracts: {
          some: { status: ContractStatus.ACTIVE },
        },
      },
    });

    // Calculate occupancy rate
    const occupancyRate =
      totalRooms > 0 ? (occupiedRoomsCount / totalRooms) * 100 : 0;

    return {
      totalProperties,
      totalRooms,
      occupiedRooms: occupiedRoomsCount,
      vacantRooms: totalRooms - occupiedRoomsCount,
      occupancyRate: Math.round(occupancyRate * 10) / 10,
    };
  }

  /**
   * Get payment trend for last 6 months
   */
  async getPaymentTrend(landlordId: string) {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const endOfCurrentMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
    );

    // Single query for 6 months duration
    const paidInvoices = await this.prisma.invoice.findMany({
      where: {
        contract: { landlordId },
        status: InvoiceStatus.PAID,
        paidAt: {
          gte: sixMonthsAgo,
          lte: endOfCurrentMonth,
        },
      },
      select: {
        paidAt: true,
        totalAmount: true,
      },
    });

    // Initialize map with 0 for all 6 months
    const monthMap = new Map<string, number>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toISOString().slice(0, 7); // YYYY-MM
      monthMap.set(key, 0);
    }

    // Aggregate
    paidInvoices.forEach((inv) => {
      if (inv.paidAt) {
        const key = inv.paidAt.toISOString().slice(0, 7);
        if (monthMap.has(key)) {
          monthMap.set(
            key,
            monthMap.get(key)! + Number(inv.totalAmount || 0),
          );
        }
      }
    });

    return Array.from(monthMap.entries()).map(([month, amount]) => ({
      month,
      amount,
    }));
  }

  /**
   * Admin Overview Stats
   * - Global Revenue (Current Month)
   * - Global Occupancy Rate
   * - Active Users counts
   */

  /**
   * Admin Overview Stats
   * - Global Revenue (Current Month)
   * - Global Occupancy Rate
   * - Active Users counts
   */
  async getAdminOverview() {
    try {
      this.logger.log('Getting Admin Overview stats...');
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
      );

      // 1. Revenue
      const monthInvoices = await this.prisma.invoice.findMany({
        where: {
          status: InvoiceStatus.PAID,
          paidAt: { gte: startOfMonth, lte: endOfMonth },
        },
        select: { totalAmount: true },
      });
      const totalRevenue = monthInvoices.reduce(
        (sum, inv) => sum + Number(inv.totalAmount || 0),
        0,
      );

      // 2. Global Occupancy
      const totalRooms = await this.prisma.room.count();
      const occupiedRooms = await this.prisma.contract.count({
        where: { status: ContractStatus.ACTIVE },
      });
      const occupancyRate =
        totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

      // 3. Contracts
      const expiringContracts = await this.prisma.contract.count({
        where: {
          status: ContractStatus.ACTIVE,
          endDate: { lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) }, // Expiring in 30 days
        },
      });

      // 4. Users
      const activeUsers = await this.prisma.user.count({
        where: { isBanned: false },
      });

      // 5. Trends (Last 6 months revenue)
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      const trendMap = new Map<string, number>();

      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        // Normalize to start of month for consistent keys if needed, 
        // but the query returns ISO string which varies. 
        // Let's use start of month ISO as key/label.
        const start = new Date(d.getFullYear(), d.getMonth(), 1);
        trendMap.set(start.toISOString(), 0);
      }

      const trendInvoices = await this.prisma.invoice.findMany({
        where: {
          status: InvoiceStatus.PAID,
          paidAt: { gte: sixMonthsAgo, lte: endOfMonth },
        },
        select: { paidAt: true, totalAmount: true },
      });

      trendInvoices.forEach((inv) => {
        if (inv.paidAt) {
          const d = new Date(inv.paidAt);
          const key = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
          if (trendMap.has(key)) {
            trendMap.set(key, trendMap.get(key)! + Number(inv.totalAmount || 0));
          }
        }
      });

      const trends = Array.from(trendMap.entries()).map(([date, revenue]) => ({
        date,
        revenue,
      }));

      this.logger.log('Admin Overview stats calculated successfully');
      return {
        totalRevenue,
        occupancyRate: Math.round(occupancyRate * 10) / 10,
        expiringContracts,
        activeUsers,
        trends,
        totalRooms,
      };
    } catch (error) {
      this.logger.error('Error getting admin overview', error.stack);
      throw error;
    }
  }

  /**
   * Admin Top Performers
   */
  async getTopPerformers() {
    try {
      // 1. Top Landlords by Revenue (This month)
      // Note: Complex aggregation is better done in SQL, but for MVP we do logical aggregation
      // Or fetch all landlords and map. Optimization: Fetch invoices and group by landlord.

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Fix: Use correct include for Invoice
      // Invoice -> Contract -> Room -> Property
      // (Assuming Contract has direct relation to Property or via Room)
      // Checking Schema: Invoice -> Contract. Contract -> Room. Room -> Property.
      // Also Contract has Property? Let's check schema result.
      // Based on typical schema: Contract -> Room -> Property.
      // Contract -> Landlord (User) via `landlordId`.

      const paidInvoices = await this.prisma.invoice.findMany({
        where: {
          status: InvoiceStatus.PAID,
          paidAt: { gte: startOfMonth },
        },
        include: {
          contract: {
            include: {
              landlord: {
                include: { user: true },
              },
              // Contract usually links to Room, and Room links to Property
              room: {
                include: { property: true },
              },
            },
          },
        },
      });

      // Group by Landlord
      const landlordMap = new Map<
        string,
        { name: string; revenue: number; properties: Set<string> }
      >();
      const propertyMap = new Map<
        string,
        { name: string; revenue: number; rooms: number; occupied: number }
      >();

      for (const inv of paidInvoices) {
        try {
          const l = inv.contract?.landlord;
          // Access Property via Room
          const p = inv.contract?.room?.property;
          const amount = Number(inv.totalAmount || 0);

          // Landlord Stats - Add null checks
          if (l && l.user && l.userId) {
            if (!landlordMap.has(l.userId)) {
              landlordMap.set(l.userId, {
                name: l.user.fullName || 'Unknown Landlord',
                revenue: 0,
                properties: new Set(),
              });
            }
            const lStats = landlordMap.get(l.userId)!;
            lStats.revenue += amount;
            if (p) lStats.properties.add(p.id);
          }

          // Property Stats
          if (p) {
            if (!propertyMap.has(p.id)) {
              propertyMap.set(p.id, {
                name: p.name,
                revenue: 0,
                rooms: 0,
                occupied: 0,
              });
            }
            const pStats = propertyMap.get(p.id)!;
            pStats.revenue += amount;
          }
        } catch (invoiceError) {
          this.logger.warn(
            `Error processing invoice ${inv.id}: ${invoiceError instanceof Error ? invoiceError.message : String(invoiceError)}`,
          );
          continue; // Skip this invoice and continue processing others
        }
      }

      // Post-process properties for occupancy
      const topPropIds = Array.from(propertyMap.keys());
      const propDetails = await this.prisma.property.findMany({
        where: { id: { in: topPropIds } },
        include: {
          rooms: {
            include: {
              contracts: true, // Or 'contracts' depending on schema (usually plural 'contracts')
            },
          },
        },
      });

      const properties = propDetails
        .map((p) => {
          const rev = propertyMap.get(p.id)?.revenue || 0;
          const total = p.rooms?.length || 0;
          // Check if any active contract exists in the room's contracts list
          // Assuming Room -> Contracts[] (1-n)
          const occupied = p.rooms?.filter((r) => {
            // Check active contracts
            return r.contracts?.some((c) => c.status === ContractStatus.ACTIVE);
          }).length || 0;

          return {
            id: p.id,
            name: p.name,
            revenue: rev,
            rooms: total,
            occupiedRooms: occupied,
            occupancyRate: total > 0 ? (occupied / total) * 100 : 0,
          };
        })
        .sort((a, b) => b.revenue - a.revenue);

      const landlords = Array.from(landlordMap.entries())
        .map(([id, data]) => ({
          landlordId: id,
          name: data.name,
          properties: data.properties.size,
          revenue: data.revenue,
          occupancyRate: 0, // Simplification
        }))
        .sort((a, b) => b.revenue - a.revenue);

      return {
        landlords: landlords.slice(0, 5),
        properties: properties.slice(0, 5),
      };
    } catch (error) {
      this.logger.error('Error getting top performers', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }
}
