import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { SnapshotService } from '../snapshots/snapshot.service';
import { RegulationService } from '../snapshots/regulation.service';
import { TaxCategory, TaxStatus, UserRole } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class TaxYearSummaryService {
    private readonly logger = new Logger(TaxYearSummaryService.name);
    private readonly DISCLAIMER = `⚠️ DISCLAIMER: Số liệu tham khảo - không thay thế tư vấn thuế`;

    constructor(
        private prisma: PrismaService,
        private snapshotService: SnapshotService,
        private regulationService: RegulationService,
    ) { }

    /**
     * Close year - freeze calculations forever
     * FIX #5: Frozen year summaries (no recompute after close)
     */
    async closeYear(landlordId: string, year: number, userId: string) {
        return await this.prisma.$transaction(async (tx) => {
            // Check if already closed
            const existing = await tx.taxYearSummary.findUnique({
                where: { landlordId_year: { landlordId, year } },
            });

            if (existing?.isFrozen) {
                throw new BadRequestException('Year already closed and frozen');
            }

            // Calculate ONCE
            const incomes = await tx.income.findMany({
                where: {
                    rentalUnit: { landlordId },
                    periodYear: year,
                    deletedAt: null,
                },
            });

            const taxableIncome = incomes
                .filter((i) => i.taxCategory === TaxCategory.TAXABLE)
                .reduce((sum, i) => sum.plus(i.amount), new Decimal(0));

            const nonTaxableIncome = incomes
                .filter((i) => i.taxCategory === TaxCategory.NON_TAXABLE)
                .reduce((sum, i) => sum.plus(i.amount), new Decimal(0));

            const totalIncome = taxableIncome.plus(nonTaxableIncome);

            // Get regulation at year-end
            const regulation = await this.regulationService.getActiveRegulation(
                'RENTAL_TAX',
                new Date(year, 11, 31),
            );

            const threshold = new Decimal(500_000_000); // From regulation
            const status = taxableIncome.gt(threshold)
                ? TaxStatus.MUST_DECLARE
                : TaxStatus.BELOW_THRESHOLD;

            // Create snapshot BEFORE summary
            const snapshot = await this.snapshotService.create(
                {
                    actorId: userId,
                    actorRole: UserRole.LANDLORD,
                    actionType: 'TAX_YEAR_CLOSED',
                    entityType: 'TAX_YEAR_SUMMARY',
                    entityId: 'pending',
                    timestamp: new Date(year, 11, 31),
                    ipAddress: undefined,
                    userAgent: undefined,
                    metadata: {
                        year,
                        totalIncome: totalIncome.toString(),
                        taxableIncome: taxableIncome.toString(),
                        nonTaxableIncome: nonTaxableIncome.toString(),
                        regulation_version: regulation.version,
                        threshold: threshold.toString(),
                        status,
                    },
                },
                tx,
            );

            // Create/update summary - FROZEN
            const summary = await tx.taxYearSummary.upsert({
                where: { landlordId_year: { landlordId, year } },
                create: {
                    landlordId,
                    year,
                    totalIncome,
                    taxableIncome,
                    nonTaxableIncome,
                    regulationId: regulation.id,
                    threshold,
                    status,
                    snapshotId: snapshot,
                    isFrozen: true, // ← LOCK IT!
                    closedAt: new Date(),
                    closedBy: userId,
                },
                update: {
                    totalIncome,
                    taxableIncome,
                    nonTaxableIncome,
                    regulationId: regulation.id,
                    threshold,
                    status,
                    isFrozen: true,
                    closedAt: new Date(),
                    closedBy: userId,
                },
            });

            // Update snapshot entityId
            await tx.legalSnapshot.update({
                where: { id: snapshot },
                data: { entityId: summary.id },
            });

            this.logger.log(`Year ${year} closed for landlord ${landlordId}`);

            return summary;
        });
    }

    /**
     * Get summary - NEVER recompute if frozen
     * FIX #5: Read frozen data, don't recalculate
     */
    async getSummary(landlordId: string, year: number) {
        const summary = await this.prisma.taxYearSummary.findUnique({
            where: { landlordId_year: { landlordId, year } },
            include: { regulation: true, snapshot: true },
        });

        if (summary?.isFrozen) {
            // Return frozen data - DO NOT recompute!
            return {
                ...summary,
                totalIncome: summary.totalIncome.toNumber(),
                taxableIncome: summary.taxableIncome.toNumber(),
                nonTaxableIncome: summary.nonTaxableIncome.toNumber(),
                threshold: summary.threshold.toNumber(),
                disclaimer: '⚠️ Năm đã chốt - số liệu không thay đổi',
                isFrozen: true,
                note: 'Đây là số liệu đã được chốt sổ. Vui lòng tham khảo chuyên gia thuế.',
            };
        }

        // If not frozen, compute draft (live data)
        return this.computeDraft(landlordId, year);
    }

    /**
     * Compute draft summary (not frozen yet)
     */
    private async computeDraft(landlordId: string, year: number) {
        const incomes = await this.prisma.income.findMany({
            where: {
                rentalUnit: { landlordId },
                periodYear: year,
                deletedAt: null,
            },
        });

        const taxableIncome = incomes
            .filter((i) => i.taxCategory === TaxCategory.TAXABLE)
            .reduce((sum, i) => sum.plus(i.amount), new Decimal(0));

        const nonTaxableIncome = incomes
            .filter((i) => i.taxCategory === TaxCategory.NON_TAXABLE)
            .reduce((sum, i) => sum.plus(i.amount), new Decimal(0));

        const totalIncome = taxableIncome.plus(nonTaxableIncome);
        const threshold = new Decimal(500_000_000);

        return {
            year,
            totalIncome: totalIncome.toNumber(),
            taxableIncome: taxableIncome.toNumber(),
            nonTaxableIncome: nonTaxableIncome.toNumber(),
            threshold: threshold.toNumber(),
            status:
                taxableIncome.gt(threshold)
                    ? TaxStatus.MUST_DECLARE
                    : TaxStatus.BELOW_THRESHOLD,
            isFrozen: false,
            disclaimer: this.DISCLAIMER,
            note: 'Đây là số liệu tạm tính. Chưa chốt sổ.',
        };
    }

    /**
     * Export tax data with disclaimers
     */
    async exportData(landlordId: string, year: number) {
        const summary = await this.getSummary(landlordId, year);

        const incomes = await this.prisma.income.findMany({
            where: {
                rentalUnit: { landlordId },
                periodYear: year,
                deletedAt: null,
            },
            orderBy: { receivedAt: 'asc' },
        });

        // Generate CSV
        const csvHeader =
            'Month,Income Type,Amount (VND),Tax Category,Received Date,Receipt Number\n';
        const csvRows = incomes
            .map(
                (i) =>
                    `${i.periodMonth},${i.incomeType},${i.amount},${i.taxCategory},${i.receivedAt.toISOString()},${i.receiptNumber || 'N/A'}`,
            )
            .join('\n');

        const csv = `"DISCLAIMER: Số liệu tham khảo - Không phải tư vấn thuế"\n"Landlord phải tự xác nhận và chịu trách nhiệm khi khai thuế"\n"Vui lòng tham khảo chuyên gia thuế/kế toán"\n\n${csvHeader}${csvRows}\n\n"Total Revenue: ${summary.totalIncome} VND"\n"Taxable Income: ${summary.taxableIncome} VND"\n"Reference Threshold: ${summary.threshold} VND"\n"Status: ${summary.status}"\n`;

        return {
            csv,
            summary,
            disclaimer: this.DISCLAIMER,
        };
    }
}
