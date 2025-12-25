import {
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import {
    TenantPaymentHistoryQueryDto,
    TenantPaymentHistoryResponseDto,
    TenantExpenseQueryDto,
    TenantExpenseResponseDto,
    PaymentRecordDto,
    MonthlyExpenseDto,
} from '../dto/tenant-report.dto';

@Injectable()
export class TenantReportService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Get payment history for a tenant
     */
    async getTenantPaymentHistory(
        query: TenantPaymentHistoryQueryDto,
    ): Promise<TenantPaymentHistoryResponseDto> {
        const { tenantId, startDate, endDate, page = 1, limit = 10 } = query;

        // Verify tenant exists
        const tenant = await this.prisma.tenant.findUnique({
            where: { userId: tenantId },
        });

        if (!tenant) {
            throw new NotFoundException(`Tenant ${tenantId} not found`);
        }

        // Build date filter
        const dateFilter = {
            ...(startDate && { gte: new Date(startDate) }),
            ...(endDate && { lte: new Date(endDate) }),
        };

        // Get total count
        const totalItems = await this.prisma.payment.count({
            where: {
                tenantId,
                ...(startDate || endDate ? { paymentDate: dateFilter } : {}),
            },
        });

        // Get paginated payments with invoice details
        const payments = await this.prisma.payment.findMany({
            where: {
                tenantId,
                ...(startDate || endDate ? { paymentDate: dateFilter } : {}),
            },
            include: {
                invoice: {
                    select: {
                        invoiceNumber: true,
                        dueDate: true,
                    },
                },
            },
            orderBy: { paymentDate: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        });

        // Calculate payment delays
        const paymentRecords: PaymentRecordDto[] = payments.map((p) => {
            const daysLate =
                p.paidAt && p.invoice.dueDate
                    ? Math.max(
                        0,
                        Math.floor(
                            (p.paidAt.getTime() - p.invoice.dueDate.getTime()) /
                            (1000 * 60 * 60 * 24),
                        ),
                    )
                    : null;

            return {
                paymentId: p.id,
                invoiceNumber: p.invoice.invoiceNumber,
                amount: Number(p.amount),
                paymentMethod: p.paymentMethod,
                paymentDate: p.paymentDate.toISOString(),
                status: p.status,
                dueDate: p.invoice.dueDate.toISOString(),
                daysLate,
            };
        });

        // Calculate summary statistics
        const allPayments = await this.prisma.payment.findMany({
            where: { tenantId },
            include: {
                invoice: {
                    select: { dueDate: true },
                },
            },
        });

        const onTimePayments = allPayments.filter(
            (p) => p.paidAt && p.invoice.dueDate && p.paidAt <= p.invoice.dueDate,
        ).length;

        const latePayments = allPayments.filter(
            (p) => p.paidAt && p.invoice.dueDate && p.paidAt > p.invoice.dueDate,
        ).length;

        const totalDelays = allPayments.reduce((sum, p) => {
            if (p.paidAt && p.invoice.dueDate && p.paidAt > p.invoice.dueDate) {
                return (
                    sum +
                    Math.floor(
                        (p.paidAt.getTime() - p.invoice.dueDate.getTime()) /
                        (1000 * 60 * 60 * 24),
                    )
                );
            }
            return sum;
        }, 0);

        return {
            summary: {
                totalPayments: allPayments.length,
                totalAmount: allPayments.reduce((sum, p) => sum + Number(p.amount), 0),
                onTimePayments,
                latePayments,
                averagePaymentDelay: latePayments > 0 ? totalDelays / latePayments : 0,
            },
            payments: paymentRecords,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalItems / limit),
                totalItems,
                itemsPerPage: limit,
            },
        };
    }

    /**
     * Get expense tracking for a tenant
     */
    async getTenantExpenses(
        query: TenantExpenseQueryDto,
    ): Promise<TenantExpenseResponseDto> {
        const { tenantId, months = 12 } = query;

        // Verify tenant exists
        const tenant = await this.prisma.tenant.findUnique({
            where: { userId: tenantId },
        });

        if (!tenant) {
            throw new NotFoundException(`Tenant ${tenantId} not found`);
        }

        // Get invoices with line items for the period
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - months);

        const invoices = await this.prisma.invoice.findMany({
            where: {
                tenantId,
                issueDate: {
                    gte: startDate,
                },
            },
            include: {
                lineItems: true,
            },
            orderBy: { issueDate: 'asc' },
        });

        // Group by month and categorize expenses
        const monthlyMap = new Map<string, MonthlyExpenseDto>();

        invoices.forEach((invoice) => {
            const date = new Date(invoice.issueDate);
            const key = `${date.getFullYear()}-${date.getMonth() + 1}`;

            if (!monthlyMap.has(key)) {
                monthlyMap.set(key, {
                    year: date.getFullYear(),
                    month: date.getMonth() + 1,
                    rent: 0,
                    utilities: 0,
                    services: 0,
                    maintenance: 0,
                    total: 0,
                });
            }

            const monthData = monthlyMap.get(key)!;

            invoice.lineItems.forEach((item) => {
                const amount = Number(item.amount);
                monthData.total += amount;

                switch (item.itemType) {
                    case 'RENT':
                        monthData.rent += amount;
                        break;
                    case 'UTILITY':
                        monthData.utilities += amount;
                        break;
                    case 'SERVICE':
                        monthData.services += amount;
                        break;
                    case 'OTHER':
                        monthData.maintenance += amount;
                        break;
                }
            });
        });

        const monthlyBreakdown = Array.from(monthlyMap.values()).sort(
            (a, b) => a.year - b.year || a.month - b.month,
        );

        // Calculate totals
        const totalExpenses = monthlyBreakdown.reduce((sum, m) => sum + m.total, 0);
        const averageMonthly =
            monthlyBreakdown.length > 0 ? totalExpenses / monthlyBreakdown.length : 0;

        const highestMonth =
            monthlyBreakdown.length > 0
                ? monthlyBreakdown.reduce((max, m) => (m.total > max.total ? m : max))
                : null;

        const categoryBreakdown = {
            rent: monthlyBreakdown.reduce((sum, m) => sum + m.rent, 0),
            utilities: monthlyBreakdown.reduce((sum, m) => sum + m.utilities, 0),
            services: monthlyBreakdown.reduce((sum, m) => sum + m.services, 0),
            maintenance: monthlyBreakdown.reduce((sum, m) => sum + m.maintenance, 0),
        };

        return {
            summary: {
                totalExpenses,
                averageMonthly,
                highestMonth: highestMonth
                    ? {
                        year: highestMonth.year,
                        month: highestMonth.month,
                        amount: highestMonth.total,
                    }
                    : null,
            },
            monthlyBreakdown,
            categoryBreakdown,
        };
    }
}
