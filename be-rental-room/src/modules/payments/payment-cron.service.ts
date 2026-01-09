import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { PaymentService } from './payment.service';
import {
  ContractStatus,
  RoomStatus,
  InvoiceStatus,
  ItemType,
} from '@prisma/client';

@Injectable()
export class PaymentCronService {
  private readonly logger = new Logger(PaymentCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentService: PaymentService,
  ) {}

  /**
   * Run every 5 minutes to check pending deposits
   */
  @Cron('*/15 * * * *')
  async checkPendingDeposits() {
    this.logger.log('Starting checkPendingDeposits job...');

    try {
      // 1. Find contracts in DEPOSIT_PENDING
      const pendingContracts = await this.prisma.contract.findMany({
        where: {
          status: ContractStatus.DEPOSIT_PENDING,
        },
        include: {
          room: true,
          landlord: true, // Needed for PaymentConfig lookup in SepayService
        },
      });

      this.logger.log(`Found ${pendingContracts.length} pending contracts.`);

      for (const contract of pendingContracts) {
        // 2. Check cancellation deadline
        const now = new Date();
        if (contract.depositDeadline && now > contract.depositDeadline) {
          await this.cancelContract(contract);
          continue;
        }

        // 3. Verify Payment with Payment Service (uses configured gateway - currently Sepay)
        // Note: contract.deposit is Decimal, convert to number
        const expectedAmount = Number(contract.deposit);
        const paymentResult = await this.paymentService.verifyPayment(
          contract,
          expectedAmount,
        );

        if (paymentResult.success) {
          await this.activateContract(contract);
        }
      }
    } catch (error) {
      this.logger.error('Error in checkPendingDeposits cron', error);
    }
  }

  private async activateContract(contract: any) {
    try {
      this.logger.log(`Activating contract ${contract.contractNumber}...`);

      await this.prisma.$transaction(async (tx) => {
        // Update Contract
        await tx.contract.update({
          where: { id: contract.id },
          data: {
            status: ContractStatus.ACTIVE,
            // Clear deadline as it's paid
            depositDeadline: null,
          },
        });

        // Update Room
        await tx.room.update({
          where: { id: contract.roomId },
          data: {
            status: RoomStatus.OCCUPIED,
          },
        });

        // Create Invoice for Deposit (Required for Payment FK)
        const invoice = await tx.invoice.create({
          data: {
            contractId: contract.id,
            tenantId: contract.tenantId,
            invoiceNumber: `INV-${contract.contractNumber}-DEP`,
            issueDate: new Date(),
            dueDate: new Date(),
            totalAmount: contract.deposit,
            status: InvoiceStatus.PAID,
            paidAt: new Date(),
            lineItems: {
              create: {
                itemType: ItemType.OTHER,
                description: 'Tiền cọc hợp đồng (Deposit)',
                quantity: 1,
                unitPrice: contract.deposit,
                amount: contract.deposit,
              },
            },
          },
        });

        // Create Payment Record
        await tx.payment.create({
          data: {
            amount: contract.deposit,
            paymentMethod: 'BANK_TRANSFER',
            status: 'COMPLETED',
            tenantId: contract.tenantId,
            invoiceId: invoice.id,
          },
        });
      });

      this.logger.log(
        `Contract ${contract.contractNumber} ACTIVATED successfully.`,
      );
    } catch (error) {
      this.logger.error(`Failed to activate contract ${contract.id}`, error);
    }
  }

  private async cancelContract(contract: any) {
    try {
      this.logger.warn(
        `Cancelling expired contract ${contract.contractNumber}...`,
      );

      await this.prisma.$transaction([
        // Update Contract
        this.prisma.contract.update({
          where: { id: contract.id },
          data: {
            status: ContractStatus.CANCELLED,
            terminationReason:
              'Deposit payment deadline expired (Auto-cancelled)',
            terminatedAt: new Date(),
          },
        }),
        // Release Room
        this.prisma.room.update({
          where: { id: contract.roomId },
          data: {
            status: RoomStatus.AVAILABLE,
          },
        }),
      ]);

      this.logger.log(`Contract ${contract.contractNumber} CANCELLED.`);
    } catch (error) {
      this.logger.error(`Failed to cancel contract ${contract.id}`, error);
    }
  }
}
