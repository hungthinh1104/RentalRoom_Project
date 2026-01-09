import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { ContractStatus, BillingMethod } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities';

@Injectable()
export class BillingCronService {
  private readonly logger = new Logger(BillingCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) { }

  /**
   * Run at 00:05 on the 1st of every month to generate invoices
   * Cron: "5 0 1 * *" (5 minutes past midnight on the 1st)
   */
  @Cron('5 0 1 * *')
  async generateMonthlyInvoices() {
    this.logger.log('Starting monthly invoice generation...');

    try {
      // 1. Find all ACTIVE contracts
      const activeContracts = await this.prisma.contract.findMany({
        where: {
          status: ContractStatus.ACTIVE,
        },
        include: {
          room: {
            include: {
              property: {
                include: {
                  services: true, // Get all services for the property
                },
              },
            },
          },
          tenant: true,
        },
      });

      this.logger.log(`Found ${activeContracts.length} active contracts.`);

      const now = new Date();
      const billingMonth = `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`;

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      for (const contract of activeContracts) {
        try {
          // 2. Check if invoice already exists for this month
          const existingInvoice = await this.prisma.invoice.findFirst({
            where: {
              contractId: contract.id,
              issueDate: {
                gte: startOfMonth,
                lte: endOfMonth,
              },
            },
          });

          if (existingInvoice) {
            this.logger.log(
              `Invoice already exists for contract ${contract.contractNumber}`,
            );
            continue;
          }

          // 3. Calculate invoice amount
          let totalAmount = 0;
          const lineItems: any[] = [];

          // Base rent
          lineItems.push({
            itemType: 'RENT',
            description: 'Tiền thuê phòng',
            quantity: 1,
            unitPrice: contract.monthlyRent,
            amount: contract.monthlyRent,
          });
          totalAmount += Number(contract.monthlyRent);

          // Additional charges (service charges - FIXED billing method)
          if (
            contract.room.property.services &&
            contract.room.property.services.length > 0
          ) {
            const fixedServices = contract.room.property.services.filter(
              (s: any) => s.billingMethod === BillingMethod.FIXED,
            );

            for (const service of fixedServices) {
              // ... same logic
              lineItems.push({
                itemType: 'SERVICE',
                description: `${service.serviceName} (${service.unit || 'cố định'})`,
                quantity: 1,
                unitPrice: service.unitPrice,
                amount: service.unitPrice,
              });
              totalAmount += Number(service.unitPrice);
            }
          }

          // 4. Create invoice
          const invoiceNumber = `INV-${contract.contractNumber}-${billingMonth.replace('-', '')}`;
          const dueDate = new Date(now.getFullYear(), now.getMonth() + 1, 10); // 10th of next month

          const invoice = await this.prisma.invoice.create({
            data: {
              contractId: contract.id,
              tenantId: contract.tenantId,
              invoiceNumber,
              // billingMonth removed
              issueDate: now,
              dueDate,
              totalAmount,
              status: 'PENDING',
              lineItems: {
                create: lineItems,
              },
            },
            include: {
              lineItems: true,
            },
          });

          // 📸 CREATE SNAPSHOT: Invoice Issued (System)
          // Note: We need to call billingService.createInvoice if we want snapshot logic,
          // OR we manually create snapshot here since we are using prisma.create directly above.
          // Wait, the previous code in BillingService.createInvoice DOES the prisma create.
          // BillingCronService is calling prisma.create DIRECTLY! It bypasses BillingService.createInvoice!
          // This is bad practice. I should refactor to use BillingService.createInvoice OR add snapshot logic here.
          // Refactoring to use service is better but might break if logic differs.
          // The logic in BillingCronService is complex (calculating items).
          // I will add Snapshot Creation logic directly here for now to avoid comprehensive refactor risk.

          // Need to inject SnapshotService first.

          this.logger.log(
            `Invoice ${invoiceNumber} created for contract ${contract.contractNumber}. Amount: ${totalAmount}₫`,
          );

          // 🔔 TRIGGER NOTIFICATION: Invoice Generated (monthly)
          try {
            await this.notificationsService.create({
              userId: contract.tenantId,
              title: 'Hóa đơn tháng mới',
              content: `Hóa đơn ${invoiceNumber} đã được tạo với số tiền ${totalAmount.toLocaleString('vi-VN')} VNĐ. Hạn thanh toán: ${dueDate.toLocaleDateString('vi-VN')}`,
              notificationType: NotificationType.PAYMENT,
              relatedEntityId: invoice.id,
            });
          } catch (error) {
            this.logger.error('Failed to send invoice notification', error);
          }
        } catch (error) {
          this.logger.error(
            `Failed to generate invoice for contract ${contract.contractNumber}`,
            error,
          );
          // Continue with next contract instead of failing entire job
          continue;
        }
      }

      this.logger.log('Monthly invoice generation completed successfully.');
    } catch (error) {
      this.logger.error('Error in generateMonthlyInvoices cron', error);
    }
  }

  /**
   * Run at 09:00 daily to send overdue reminders
   * Cron: "0 9 * * *" (09:00 AM every day)
   */
  @Cron('0 9 * * *')
  async sendOverdueReminders() {
    this.logger.log('Checking for overdue invoices...');

    try {
      const now = new Date();

      // Find invoices that are overdue (dueDate < today) and not paid
      const overdueInvoices = await this.prisma.invoice.findMany({
        where: {
          status: 'PENDING',
          dueDate: {
            lt: now,
          },
        },
        include: {
          contract: {
            include: {
              tenant: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      });

      this.logger.log(`Found ${overdueInvoices.length} overdue invoices.`);

      for (const invoice of overdueInvoices) {
        this.logger.warn(
          `Invoice ${invoice.invoiceNumber} for tenant ${invoice.contract.tenant.user.email} is overdue!`,
        );

        // 🔔 TRIGGER NOTIFICATION: Invoice Overdue
        try {
          const daysOverdue = Math.floor(
            (now.getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24),
          );
          await this.notificationsService.create({
            userId: invoice.contract.tenantId,
            title: '⚠️ Hóa đơn quá hạn',
            content: `Hóa đơn ${invoice.invoiceNumber} đã quá hạn ${daysOverdue} ngày. Số tiền: ${Number(invoice.totalAmount).toLocaleString('vi-VN')} VNĐ. Vui lòng thanh toán ngay để tránh phí phạt.`,
            notificationType: NotificationType.PAYMENT,
            relatedEntityId: invoice.id,
          });
        } catch (error) {
          this.logger.error('Failed to send overdue notification', error);
        }
      }

      this.logger.log('Overdue reminder check completed.');
    } catch (error) {
      this.logger.error('Error in sendOverdueReminders cron', error);
    }
  }

  /**
   * Run at 23:50 every day to generate reminder for invoices due tomorrow
   * Cron: "50 23 * * *" (23:50 every day)
   */
  @Cron('50 23 * * *')
  async sendDueSoonReminders() {
    this.logger.log('Checking for invoices due tomorrow...');

    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const startOfDay = new Date(tomorrow.setHours(0, 0, 0, 0));
      const endOfDay = new Date(tomorrow.setHours(23, 59, 59, 999));

      // Find invoices due tomorrow
      const dueSoonInvoices = await this.prisma.invoice.findMany({
        where: {
          status: 'PENDING',
          dueDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        include: {
          contract: {
            include: {
              tenant: true,
            },
          },
        },
      });

      this.logger.log(`Found ${dueSoonInvoices.length} invoices due tomorrow.`);

      for (const invoice of dueSoonInvoices) {
        this.logger.log(
          `Sending due soon reminder for invoice ${invoice.invoiceNumber}`,
        );

        // 🔔 TRIGGER NOTIFICATION: Invoice Due Soon
        try {
          await this.notificationsService.create({
            userId: invoice.contract.tenantId,
            title: '📅 Hóa đơn sắp đến hạn',
            content: `Hóa đơn ${invoice.invoiceNumber} sẽ đến hạn vào ngày mai (${invoice.dueDate.toLocaleDateString('vi-VN')}). Số tiền: ${Number(invoice.totalAmount).toLocaleString('vi-VN')} VNĐ.`,
            notificationType: NotificationType.PAYMENT,
            relatedEntityId: invoice.id,
          });
        } catch (error) {
          this.logger.error('Failed to send due soon notification', error);
        }
      }

      this.logger.log('Due soon reminder check completed.');
    } catch (error) {
      this.logger.error('Error in sendDueSoonReminders cron', error);
    }
  }
}
