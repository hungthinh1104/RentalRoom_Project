import { Injectable, Logger, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { SnapshotService } from '../snapshots/snapshot.service';
import { CreateIncomeDto } from './dto/income.dto';
import { IncomeType, TaxCategory, UserRole } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities';

@Injectable()
export class IncomeService {
    private readonly logger = new Logger(IncomeService.name);
    private readonly DISCLAIMER = `⚠️ Số liệu tham khảo - không thay thế tư vấn thuế`;

    constructor(
        private prisma: PrismaService,
        private snapshotService: SnapshotService,
        private notificationsService: NotificationsService,
    ) { }

    /**
     * Create income with automatic tax decision and snapshot
     * FIX: Auto-determine tax category + log decision in snapshot
     */
    async create(dto: CreateIncomeDto, userId: string) {
        // Enforce Business Rule: RENT must have a Tenant associated (for tax declaration accuracy)
        if (dto.incomeType === IncomeType.RENTAL && !dto.tenantId) {
            throw new BadRequestException('Bắt buộc phải có khách thuê đối với nguồn thu Tiền Phòng (RENT)');
        }

        const income = await this.prisma.$transaction(async (tx) => {
            // Auto-derive period from receivedAt
            const receivedDate = new Date(dto.receivedAt);
            const periodYear = receivedDate.getFullYear();
            const periodMonth = receivedDate.getMonth() + 1;
            const periodMonthStr = `${periodYear}-${periodMonth.toString().padStart(2, '0')}`;

            // Determine tax category with reasoning
            const taxDecision = this.determineTaxCategory(dto.incomeType);

            // Create income
            const newIncome = await tx.income.create({
                data: {
                    rentalUnitId: dto.rentalUnitId,
                    tenantId: dto.tenantId,
                    amount: new Decimal(dto.amount),
                    currency: 'VND',
                    incomeType: dto.incomeType,
                    taxCategory: taxDecision.category,
                    periodYear,
                    periodMonth,
                    periodMonthStr,
                    receivedAt: receivedDate,
                    paymentMethod: dto.paymentMethod,
                    receiptNumber: dto.receiptNumber,
                    note: dto.note,
                    snapshotId: 'pending', // Will update after snapshot creation
                },
            });

            // Create snapshot with tax decision
            const snapshot = await this.snapshotService.create(
                {
                    actorId: userId,
                    actorRole: UserRole.LANDLORD,
                    actionType: 'INCOME_RECEIVED',
                    entityType: 'INCOME',
                    entityId: newIncome.id,
                    timestamp: newIncome.receivedAt,
                    ipAddress: undefined,
                    userAgent: undefined,
                    metadata: {
                        amount: newIncome.amount.toString(),
                        incomeType: newIncome.incomeType,
                        periodMonth: newIncome.periodMonthStr,
                        tax_decision: {
                            is_taxable: taxDecision.isTaxable,
                            category: taxDecision.category,
                            reason: taxDecision.reason,
                            legal_basis: taxDecision.legalBasis,
                            computed_at: new Date().toISOString(),
                        },
                    },
                },
                tx,
            );

            // Link snapshot to income
            await tx.income.update({
                where: { id: newIncome.id },
                data: { snapshotId: snapshot },
            });

            return newIncome;
        });

        // Trigger Notification (Async)
        this.notificationsService.create({
            userId,
            title: '💰 Thu nhập mới',
            content: `Đã ghi nhận ${Number(income.amount).toLocaleString('vi-VN')} VND (${income.incomeType})`,
            notificationType: NotificationType.SYSTEM,
            relatedEntityId: income.id,
        }).catch(e => this.logger.error(`Failed to send notification: ${e.message}`));

        return income;
    }

    /**
     * Tax Decision Engine - Auto-determine tax category
     * FIX #1: Taxable classification with legal reasoning
     */
    private determineTaxCategory(incomeType: IncomeType) {
        // Tax classification logic
        const taxMapping: Record<
            IncomeType,
            {
                category: TaxCategory;
                isTaxable: boolean;
                reason: string;
                legalBasis: string;
            }
        > = {
            RENTAL: {
                category: TaxCategory.TAXABLE,
                isTaxable: true,
                reason: 'Thu nhập từ cho thuê nhà',
                legalBasis: 'Luật Thuế TNCN 2007, Điều 3',
            },
            DEPOSIT: {
                category: TaxCategory.NON_TAXABLE,
                isTaxable: false,
                reason: 'Initial deposit - refundable, not income until forfeited',
                legalBasis: 'Civil Code 2015, Article 328',
            },
            PENALTY: {
                category: TaxCategory.TAXABLE,
                isTaxable: true,
                reason: 'Penalty / Forfeited deposit',
                legalBasis: 'Civil Code 2015 + Tax guidance',
            },
            OTHER: {
                category: TaxCategory.CONDITIONAL,
                isTaxable: false,
                reason: 'Requires manual review',
                legalBasis: 'N/A',
            },
        };

        return (
            taxMapping[incomeType] || {
                category: TaxCategory.CONDITIONAL,
                isTaxable: false,
                reason: 'Unknown income type - requires review',
                legalBasis: 'N/A',
            }
        );
    }

    /**
     * Soft delete income with void snapshot
     * FIX #4: Soft delete with audit trail
     */
    async delete(id: string, userId: string, reason: string) {
        return await this.prisma.$transaction(async (tx) => {
            const income = await tx.income.update({
                where: { id },
                data: {
                    deletedAt: new Date(),
                    deletedBy: userId,
                    deleteReason: reason,
                },
            });

            // Create void snapshot
            await this.snapshotService.create(
                {
                    actorId: userId,
                    actorRole: UserRole.LANDLORD,
                    actionType: 'INCOME_VOIDED',
                    entityType: 'INCOME',
                    entityId: id,
                    timestamp: new Date(),
                    ipAddress: undefined,
                    userAgent: undefined,
                    metadata: {
                        original_amount: income.amount.toString(),
                        void_reason: reason,
                        original_period: income.periodMonthStr,
                    },
                },
                tx,
            );

            return income;
        });
    }

    /**
     * Get year projection with early warnings
     * FIX #6: Real-time threshold warnings
     */
    async getYearProjection(landlordId: string, year: number) {
        const incomes = await this.prisma.income.findMany({
            where: {
                rentalUnit: { landlordId },
                periodYear: year,
                taxCategory: TaxCategory.TAXABLE,
                deletedAt: null, // Only active incomes
            },
        });

        const totalSoFar = incomes.reduce(
            (sum, i) => sum.plus(i.amount),
            new Decimal(0),
        );

        const threshold = new Decimal(500_000_000); // 500M VND
        const percent = totalSoFar.div(threshold).times(100).toNumber();

        let warningLevel: 'SAFE' | 'WARNING' | 'DANGER';
        if (percent < 70) warningLevel = 'SAFE';
        else if (percent < 90) warningLevel = 'WARNING';
        else warningLevel = 'DANGER';

        return {
            year,
            totalSoFar: totalSoFar.toNumber(),
            threshold: threshold.toNumber(),
            percent: Math.round(percent),
            warningLevel,
            disclaimer: this.DISCLAIMER,
            message: this.getWarningMessage(warningLevel, Math.round(percent)),
        };
    }

    private getWarningMessage(level: string, percent: number): string {
        if (level === 'SAFE') {
            return `✅ Thu nhập ${percent}% ngưỡng - an toàn`;
        } else if (level === 'WARNING') {
            return `⚠️ Thu nhập ${percent}% ngưỡng - nên theo dõi`;
        } else {
            return `🚨 Thu nhập ${percent}% ngưỡng - cân nhắc tham khảo chuyên gia`;
        }
    }

    /**
     * Find all incomes with filters and authorization
     */
    async findAll(
        landlordId: string,
        year?: number,
        month?: number,
        includeDeleted = false,
    ) {
        return await this.prisma.income.findMany({
            where: {
                rentalUnit: { landlordId },
                ...(year && { periodYear: year }),
                ...(month && { periodMonth: month }),
                ...(!includeDeleted && { deletedAt: null }),
            },
            include: {
                rentalUnit: {
                    select: { name: true, address: true },
                },
                tenant: {
                    select: { user: { select: { fullName: true } } },
                },
                snapshot: {
                    select: { id: true, dataHash: true, createdAt: true },
                },
            },
            orderBy: { receivedAt: 'desc' },
        });
    }

    /**
     * Get year summary with disclaimer
     */
    async getYearSummary(landlordId: string, year: number) {
        const incomes = await this.findAll(landlordId, year);

        const taxableIncomes = incomes.filter(
            (i) => i.taxCategory === TaxCategory.TAXABLE,
        );
        const nonTaxableIncomes = incomes.filter(
            (i) => i.taxCategory === TaxCategory.NON_TAXABLE,
        );

        const taxableTotal = taxableIncomes.reduce(
            (sum, i) => sum.plus(i.amount),
            new Decimal(0),
        );
        const nonTaxableTotal = nonTaxableIncomes.reduce(
            (sum, i) => sum.plus(i.amount),
            new Decimal(0),
        );
        const total = taxableTotal.plus(nonTaxableTotal);

        // Monthly breakdown
        const byMonth = Array.from({ length: 12 }, (_, i) => {
            const month = i + 1;
            const monthIncomes = incomes.filter((inc) => inc.periodMonth === month);
            const monthTotal = monthIncomes.reduce(
                (sum, i) => sum.plus(i.amount),
                new Decimal(0),
            );
            return {
                month,
                total: monthTotal.toNumber(),
                count: monthIncomes.length,
            };
        });

        return {
            year,
            total: total.toNumber(),
            taxableTotal: taxableTotal.toNumber(),
            nonTaxableTotal: nonTaxableTotal.toNumber(),
            count: incomes.length,
            byMonth,
            disclaimer: this.DISCLAIMER,
            note: 'Vui lòng tự kiểm tra với kế toán/thuế vụ',
        };
    }
}
