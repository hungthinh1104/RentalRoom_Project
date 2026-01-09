import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import * as crypto from 'crypto';
import { Decimal } from '@prisma/client/runtime/library';
import { UserRole } from '@prisma/client';

@Injectable()
export class TaxService {
  private readonly logger = new Logger(TaxService.name);
  private readonly TAX_THRESHOLD = 500_000_000; // 500M VND/year

  constructor(private prisma: PrismaService) { }

  /**
   * Generate monthly revenue snapshot for a landlord
   * Pre-calculates for fast tax dashboard
   */
  async generateMonthlySnapshot(
    landlordId: string,
    year: number,
    month: number,
  ) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    // Query all invoices paid in this month
    const invoices = await this.prisma.invoice.findMany({
      where: {
        contract: {
          landlordId,
        },
        paidAt: {
          gte: startDate,
          lt: endDate,
        },
        status: 'PAID',
      },
      include: {
        contract: {
          include: {
            room: {
              select: {
                id: true,
                roomNumber: true,
              },
            },
          },
        },
      },
    });

    const totalRevenue = invoices.reduce(
      (sum, inv) => sum + Number(inv.totalAmount),
      0,
    );

    // Room-level breakdown
    const breakdown = invoices.map((inv) => ({
      roomId: inv.contract.room.id,
      roomNumber: inv.contract.room.roomNumber,
      revenue: Number(inv.totalAmount),
    }));

    // Generate hash for immutability
    const hash = this.generateHash({
      landlordId,
      year,
      month,
      totalRevenue,
      invoiceCount: invoices.length,
    });

    // Upsert snapshot
    const snapshot = await this.prisma.landlordRevenueSnapshot.upsert({
      where: {
        landlordId_year_month: {
          landlordId,
          year,
          month,
        },
      },
      update: {
        totalRevenue: new Decimal(totalRevenue),
        invoiceCount: invoices.length,
        breakdown: breakdown as any,
        snapshotHash: hash,
      },
      create: {
        landlordId,
        year,
        month,
        totalRevenue: new Decimal(totalRevenue),
        invoiceCount: invoices.length,
        breakdown: breakdown as any,
        snapshotHash: hash,
      },
    });

    this.logger.log(
      `Generated revenue snapshot for landlord ${landlordId} - ${year}/${month}: ${totalRevenue} VND`,
    );

    return snapshot;
  }

  /**
   * Generate annual snapshot (sum of all months)
   */
  async generateAnnualSnapshot(landlordId: string, year: number) {
    const monthlySnapshots = await this.prisma.landlordRevenueSnapshot.findMany(
      {
        where: {
          landlordId,
          year,
          month: { not: null },
        },
      },
    );

    const totalRevenue = monthlySnapshots.reduce(
      (sum, s) => sum + Number(s.totalRevenue),
      0,
    );

    const hash = this.generateHash({
      landlordId,
      year,
      month: null,
      totalRevenue,
      invoiceCount: monthlySnapshots.reduce(
        (sum, s) => sum + s.invoiceCount,
        0,
      ),
    });

    return this.prisma.landlordRevenueSnapshot.upsert({
      where: {
        landlordId_year_month: {
          landlordId,
          year,
          month: undefined as any, // Annual snapshot (month omitted)
        },
      },
      update: {
        totalRevenue: new Decimal(totalRevenue),
        invoiceCount: monthlySnapshots.reduce(
          (sum, s) => sum + s.invoiceCount,
          0,
        ),
        snapshotHash: hash,
      },
      create: {
        landlordId,
        year,
        // month is nullable, omit when creating annual snapshot
        totalRevenue: new Decimal(totalRevenue),
        invoiceCount: monthlySnapshots.reduce(
          (sum, s) => sum + s.invoiceCount,
          0,
        ),
        snapshotHash: hash,
      },
    });
  }

  /**
   * Get effective regulation for a given year
   */
  async getEffectiveRegulation(year: number) {
    // Find the latest active regulation for the given year
    const regulation = await this.prisma.regulationVersion.findFirst({
      where: {
        type: 'RENTAL_TAX',
        effectiveFrom: {
          lte: new Date(year, 11, 31), // Active by end of year
        },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: new Date(year, 0, 1) } },
        ],
      },
      orderBy: {
        effectiveFrom: 'desc',
      },
    });

    if (!regulation) {
      this.logger.warn(
        `No tax regulation found for year ${year}. Using default threshold.`,
      );
      // Default fallback (Vietnamese Law 2024: 100M VND)
      return {
        threshold: 100_000_000,
        taxRate: 0.05 + 0.05, // 5% VAT + 5% PIT
      };
    }

    // Parse configuration from JSON
    const config = (regulation as any).configuration;
    return {
      threshold: Number(config?.threshold) || 100_000_000,
      taxRate: Number(config?.taxRate) || 0.1,
    };
  }

  /**
   * Export tax data for a landlord (CSV format)
   * Includes disclaimer - NOT tax advice
   * FIX: Added service-layer authorization for defense-in-depth
   */
  async exportTaxData(
    landlordId: string,
    year: number,
    requestingUserId?: string,
    requestingUserRole?: UserRole,
  ) {
    // Defense-in-depth: Check authorization in service layer
    if (requestingUserId && requestingUserRole === UserRole.LANDLORD) {
      const landlord = await this.prisma.landlord.findUnique({
        where: { userId: requestingUserId },
      });

      if (!landlord || landlord.userId !== landlordId) {
        throw new ForbiddenException(
          'Access denied - can only access own data',
        );
      }
    }

    // Fetch Dynamic Configuration
    const { threshold } = await this.getEffectiveRegulation(year);

    const snapshots = await this.prisma.landlordRevenueSnapshot.findMany({
      where: {
        landlordId,
        year,
        month: { not: null },
      },
      orderBy: {
        month: 'asc',
      },
    });

    // FIX: Use Decimal arithmetic for precise calculation (no float errors)
    const totalRevenue = snapshots.reduce(
      (sum, s) => sum.plus(s.totalRevenue), // ← Decimal.plus() instead of + Number()
      new Decimal(0),
    );

    // Generate CSV
    const csv = this.generateCSV(snapshots, year);

    // Convert to number only for threshold comparison (safe after aggregation)
    const totalAsNumber = totalRevenue.toNumber();
    const exceedsThreshold = totalAsNumber > threshold;

    return {
      csv,
      totalRevenue: totalAsNumber, //← Convert for JSON response
      threshold: threshold,
      exceedsThreshold,
      disclaimer: `
        ❗ DISCLAIMER: This report is for reference only.
        
        - This system does NOT calculate tax owed
        - This system does NOT provide tax advice
        - Please consult a licensed tax professional or accountant
        - Vietnam tax laws may change - verify current regulations
        
        Threshold notice: ${exceedsThreshold ? `⚠️ Revenue exceeds ${threshold.toLocaleString('vi-VN')} VND/year. Tax declaration may be required.` : `✅ Revenue below ${threshold.toLocaleString('vi-VN')} VND/year threshold.`}
      `.trim(),
    };
  }

  /**
   * Generate CSV format for export
   */
  private generateCSV(snapshots: any[], year: number): string {
    const header = 'Month,Revenue (VND),Invoice Count';
    const rows = snapshots.map(
      (s) => `${year}/${s.month},${s.totalRevenue},${s.invoiceCount}`,
    );

    return [header, ...rows].join('\n');
  }

  /**
   * Generate hash for snapshot integrity
   */
  private generateHash(data: any): string {
    const canonical = JSON.stringify(data, Object.keys(data).sort());
    return crypto.createHash('sha256').update(canonical).digest('hex');
  }
}
