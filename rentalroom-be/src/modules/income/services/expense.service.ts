import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { ExpenseType, UserRole } from '@prisma/client';
import { Decimal } from 'decimal.js';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType } from '../../notifications/entities';
import { SnapshotService } from '../../snapshots/snapshot.service';

export interface CreateExpenseDto {
  rentalUnitId: string;
  amount: number;
  expenseType: ExpenseType;
  paidAt: string;
  note?: string;
  receiptNumber?: string;
}

@Injectable()
export class ExpenseService {
  private readonly logger = new Logger(ExpenseService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private snapshotService: SnapshotService,
  ) {}

  /**
   * Create expense with auto period derivation
   */
  async create(dto: CreateExpenseDto, userId: string) {
    const paidDate = new Date(dto.paidAt);
    const periodYear = paidDate.getFullYear();
    const periodMonth = paidDate.getMonth() + 1;
    const periodMonthStr = `${periodYear}-${periodMonth.toString().padStart(2, '0')}`;

    return await this.prisma
      .$transaction(async (tx) => {
        const expense = await tx.expense.create({
          data: {
            rentalUnitId: dto.rentalUnitId,
            amount: new Decimal(dto.amount),
            currency: 'VND',
            expenseType: dto.expenseType,
            periodYear,
            periodMonth,
            periodMonthStr,
            paidAt: paidDate,
            note: dto.note,
            receiptNumber: dto.receiptNumber,
          },
        });

        // 📸 CREATE SNAPSHOT: Expense Recorded (MANDATORY - fail-fast)
        const snapshotId = await this.snapshotService.create(
          {
            actorId: userId,
            actorRole: UserRole.LANDLORD,
            actionType: 'EXPENSE_RECORDED',
            entityType: 'EXPENSE',
            entityId: expense.id,
            timestamp: new Date(),
            metadata: {
              amount: expense.amount.toString(),
              expenseType: expense.expenseType,
              receiptNumber: expense.receiptNumber,
            },
          },
          tx,
        );

        await tx.expense.update({
          where: { id: expense.id },
          data: { snapshotId },
        });

        return expense;
      })
      .then((expense) => {
        // Trigger Notification (ASYNC - outside transaction)
        this.notificationsService
          .create({
            userId,
            title: '💸 Chi phí mới',
            content: `Đã ghi nhận chi ${Number(expense.amount).toLocaleString('vi-VN')} VND (${expense.expenseType})`,
            notificationType: NotificationType.SYSTEM,
            relatedEntityId: expense.id,
          })
          .catch((e) =>
            this.logger.error(`Failed to send notification: ${e.message}`),
          );

        return expense;
      });
  }

  /**
   * Find all expenses with filters
   */
  async findAll(landlordId: string, year?: number, month?: number) {
    return await this.prisma.expense.findMany({
      where: {
        rentalUnit: { landlordId },
        ...(year && { periodYear: year }),
        ...(month && { periodMonth: month }),
        deletedAt: null,
      },
      include: {
        rentalUnit: {
          select: { name: true, address: true },
        },
      },
      orderBy: { paidAt: 'desc' },
    });
  }

  /**
   * Get year summary with breakdown by type
   */
  async getYearSummary(landlordId: string, year: number) {
    const expenses = await this.findAll(landlordId, year);

    const total = expenses.reduce(
      (sum, e) => sum.plus(e.amount),
      new Decimal(0),
    );

    // By type
    const byType = Object.values(ExpenseType).map((type) => {
      const typeExpenses = expenses.filter((e) => e.expenseType === type);
      const typeTotal = typeExpenses.reduce(
        (sum, e) => sum.plus(e.amount),
        new Decimal(0),
      );
      return {
        type,
        total: typeTotal.toNumber(),
        count: typeExpenses.length,
      };
    });

    // By month
    const byMonth = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const monthExpenses = expenses.filter((e) => e.periodMonth === month);
      const monthTotal = monthExpenses.reduce(
        (sum, e) => sum.plus(e.amount),
        new Decimal(0),
      );
      return {
        month,
        total: monthTotal.toNumber(),
        count: monthExpenses.length,
      };
    });

    return {
      year,
      total: total.toNumber(),
      count: expenses.length,
      byType: byType.filter((t) => t.count > 0),
      byMonth,
      note: '⚠️ Chi phí KHÔNG được trừ khi tính thuế (theo luật VN)',
    };
  }

  /**
   * Delete expense
   */
  async delete(id: string, userId: string, reason: string) {
    return await this.prisma.$transaction(async (tx) => {
      const expense = await tx.expense.update({
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
          actionType: 'EXPENSE_VOIDED',
          entityType: 'EXPENSE',
          entityId: id,
          timestamp: new Date(),
          metadata: {
            void_reason: reason,
            amount: expense.amount.toString(),
          },
        },
        tx,
      );

      return expense;
    });
  }
}
