import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import * as crypto from 'crypto';
import { Decimal } from 'decimal.js';
import { UserRole, Prisma } from '@prisma/client';
import { SnapshotService } from '../snapshots/snapshot.service';

@Injectable()
export class TaxService {
  private readonly logger = new Logger(TaxService.name);
  private readonly TAX_THRESHOLD = 500_000_000; // 500M VND/year

  constructor(
    private prisma: PrismaService,
    private snapshotService: SnapshotService,
  ) {}

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

    return this.prisma.$transaction(async (tx) => {
      const client = tx as any;
      // Query all invoices paid in this month
      const invoices = await tx.invoice.findMany({
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

      // Regulation reference for hash integrity
      const regulation = await this.getRegulationRefForYear(year, tx);

      // Generate hash for immutability (include breakdown + regulation)
      const hash = this.generateHash({
        landlordId,
        year,
        month,
        totalRevenue,
        invoiceCount: invoices.length,
        breakdown,
        regulationVersion: regulation?.version || null,
        regulationHash: regulation?.hash || null,
      });

      // Upsert snapshot
      const snapshot = await tx.landlordRevenueSnapshot.upsert({
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
          snapshotHash: hash,
        },
        create: {
          landlordId,
          year,
          month,
          totalRevenue: new Decimal(totalRevenue),
          invoiceCount: invoices.length,
          snapshotHash: hash,
        },
      });

      await client.taxYearBreakdown.deleteMany({
        where: { landlordId, year, month },
      });

      if (breakdown.length) {
        await client.taxYearBreakdown.createMany({
          data: breakdown.map((item) => ({
            landlordId,
            year,
            month,
            roomId: item.roomId,
            roomNumber: item.roomNumber,
            revenue: new Decimal(item.revenue),
            invoiceCount: 1,
          })),
        });
      }

      // Create legal snapshot (immutable)
      const { threshold } = await this.getEffectiveRegulation(year, tx);
      await this.snapshotService.create(
        {
          actorId: landlordId,
          actorRole: UserRole.LANDLORD,
          actionType: 'TAX_SNAPSHOT_GENERATED',
          entityType: 'LANDLORD_REVENUE',
          entityId: landlordId,
          metadata: {
            year,
            month,
            totalRevenue,
            invoiceCount: invoices.length,
            threshold,
            regulationVersion: regulation?.version || null,
            regulationHash: regulation?.hash || null,
          },
        },
        tx,
      );

      this.logger.log(
        `Generated revenue snapshot for landlord ${landlordId} - ${year}/${month}: ${totalRevenue} VND`,
      );

      return snapshot;
    });
  }

  /**
   * Generate annual snapshot (sum of all months)
   */
  async generateAnnualSnapshot(landlordId: string, year: number) {
    return this.prisma.$transaction(async (tx) => {
      const monthlySnapshots = await tx.landlordRevenueSnapshot.findMany({
        where: {
          landlordId,
          year,
          month: { not: null },
        },
      });

      const totalRevenue = monthlySnapshots.reduce(
        (sum, s) => sum + Number(s.totalRevenue),
        0,
      );

      const invoiceCountTotal = monthlySnapshots.reduce(
        (sum, s) => sum + s.invoiceCount,
        0,
      );

      const regulation = await this.getRegulationRefForYear(year, tx);

      const hash = this.generateHash({
        landlordId,
        year,
        month: null,
        totalRevenue,
        invoiceCount: invoiceCountTotal,
        regulationVersion: regulation?.version || null,
        regulationHash: regulation?.hash || null,
      });

      // Upsert-like behavior for month = null (cannot use composite upsert with null)
      const existingAnnual = await tx.landlordRevenueSnapshot.findFirst({
        where: { landlordId, year, month: null },
      });

      let snapshot;
      if (existingAnnual) {
        snapshot = await tx.landlordRevenueSnapshot.update({
          where: { id: existingAnnual.id },
          data: {
            totalRevenue: new Decimal(totalRevenue),
            invoiceCount: invoiceCountTotal,
            snapshotHash: hash,
          },
        });
      } else {
        snapshot = await tx.landlordRevenueSnapshot.create({
          data: {
            landlordId,
            year,
            month: null,
            totalRevenue: new Decimal(totalRevenue),
            invoiceCount: invoiceCountTotal,
            snapshotHash: hash,
          },
        });
      }

      // Create legal snapshot (immutable)
      const { threshold } = await this.getEffectiveRegulation(year, tx);
      await this.snapshotService.create(
        {
          actorId: landlordId,
          actorRole: UserRole.LANDLORD,
          actionType: 'TAX_SNAPSHOT_GENERATED',
          entityType: 'LANDLORD_REVENUE',
          entityId: landlordId,
          metadata: {
            year,
            month: null,
            totalRevenue,
            invoiceCount: invoiceCountTotal,
            threshold,
            regulationVersion: regulation?.version || null,
            regulationHash: regulation?.hash || null,
          },
        },
        tx,
      );

      this.logger.log(
        `Generated annual revenue snapshot for landlord ${landlordId} - ${year}: ${totalRevenue} VND`,
      );

      return snapshot;
    });
  }

  /**
   * Get effective regulation for a given year
   */
  async getEffectiveRegulation(year: number, tx?: Prisma.TransactionClient) {
    // Find the latest active regulation for the given year
    const prisma = (tx as Prisma.TransactionClient) || this.prisma;
    const regulation = await prisma.regulationVersion.findFirst({
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
    const config = regulation?.configuration as
      | { threshold?: number; taxRate?: number }
      | null;
    return {
      threshold: Number(config?.threshold) || 100_000_000,
      taxRate: Number(config?.taxRate) || 0.1,
    };
  }

  /**
   * Get regulation reference (version + hash) for a given year
   */
  private async getRegulationRefForYear(
    year: number,
    tx?: Prisma.TransactionClient,
  ): Promise<{ type: string; version: string; hash: string } | null> {
    const prisma = (tx as Prisma.TransactionClient) || this.prisma;
    const regulation = await prisma.regulationVersion.findFirst({
      where: {
        type: 'RENTAL_TAX',
        effectiveFrom: { lte: new Date(year, 11, 31) },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: new Date(year, 0, 1) } },
        ],
        deletedAt: null,
      },
      orderBy: { effectiveFrom: 'desc' },
    });

    if (!regulation) return null;
    return {
      type: regulation.type,
      version: regulation.version,
      hash: regulation.contentHash,
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

    // Create export legal snapshot (immutable)
    await this.prisma.$transaction(async (tx) => {
      const regulation = await this.getRegulationRefForYear(year, tx);
      await this.snapshotService.create(
        {
          actorId: requestingUserId || landlordId,
          actorRole: requestingUserRole || UserRole.LANDLORD,
          actionType: 'TAX_DATA_EXPORTED',
          entityType: 'LANDLORD_REVENUE',
          entityId: landlordId,
          metadata: {
            year,
            totalRevenue: totalAsNumber,
            threshold,
            months: snapshots.length,
            regulationVersion: regulation?.version || null,
            regulationHash: regulation?.hash || null,
          },
        },
        tx,
      );
    });

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
