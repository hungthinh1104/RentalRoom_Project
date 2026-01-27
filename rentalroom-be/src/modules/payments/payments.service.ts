import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import {
  CreatePaymentDto,
  UpdatePaymentDto,
  FilterPaymentsDto,
  PaymentResponseDto,
} from './dto';
import { PaginatedResponse } from 'src/shared/dtos';
import { plainToClass } from 'class-transformer';
import { PaymentService } from './payment.service';
import { PaymentVerificationResult } from './interfaces';
import { User, UserRole, PaymentStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { EventStoreService } from 'src/shared/event-sourcing/event-store.service';
import { StateMachineGuard } from 'src/shared/state-machine/state-machine.guard';
import {
  ImmutabilityGuard,
  IdempotencyGuard,
} from 'src/shared/guards/immutability.guard';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentFacade: PaymentService,
    private readonly eventStore: EventStoreService,
    private readonly stateMachine: StateMachineGuard,
    private readonly immutability: ImmutabilityGuard,
    private readonly idempotency: IdempotencyGuard,
  ) {}

  async create(
    createPaymentDto: CreatePaymentDto,
    user?: User,
    idempotencyKey?: string,
  ) {
    const actorId = user?.id || createPaymentDto.tenantId;
    const key =
      idempotencyKey ||
      createPaymentDto.transactionId ||
      `${createPaymentDto.invoiceId}:${createPaymentDto.tenantId}:${createPaymentDto.amount}:${createPaymentDto.paymentDate || 'na'}`;

    const payment = await this.idempotency.executeIdempotent(
      key,
      'CREATE_PAYMENT',
      actorId,
      async () => {
        const invoice = await this.prisma.invoice.findUnique({
          where: { id: createPaymentDto.invoiceId },
        });

        if (!invoice) {
          throw new BadRequestException('Invoice not found');
        }

        if (this.stateMachine.isTerminalState('INVOICE', invoice.status)) {
          throw new BadRequestException(
            `Invoice is in terminal state (${invoice.status}); cannot create payment`,
          );
        }

        const correlationId = uuidv4();

        return this.prisma.$transaction(async (tx) => {
          const paymentRecord = await tx.payment.create({
            data: {
              ...createPaymentDto,
              status: PaymentStatus.PENDING,
            },
          });

          await this.eventStore.append({
            eventId: uuidv4(),
            eventType: 'PAYMENT_INITIATED',
            correlationId,
            aggregateId: paymentRecord.id,
            aggregateType: 'PAYMENT',
            aggregateVersion: 1,
            payload: {
              paymentId: paymentRecord.id,
              invoiceId: paymentRecord.invoiceId,
              amount: paymentRecord.amount,
              method: paymentRecord.paymentMethod,
            },
            metadata: {
              userId: actorId,
              userRole: user?.role || 'SYSTEM',
              timestamp: new Date(),
              source: 'API',
            },
          });

          return paymentRecord;
        });
      },
    );

    // Convert Decimal to Number
    const cleaned = {
      ...payment,
      amount: payment.amount ? Number(payment.amount) : 0,
    };

    return plainToClass(PaymentResponseDto, cleaned, {
      excludeExtraneousValues: true,
    });
  }

  async findAll(filterDto: FilterPaymentsDto, user?: any) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'paymentDate',
      sortOrder = 'desc',
      invoiceId,
      // tenantId, // override below
      landlordId,
      status,
      paymentMethod,
      search,
    } = filterDto;

    const where: any = {};
    let tenantId = filterDto.tenantId;

    // Security: If user is provided and is a TENANT, force tenantId filter
    if (user && user.role === 'TENANT') {
      const tenant = await this.prisma.tenant.findUnique({
        where: { userId: user.id },
      });
      if (!tenant) {
        // Should catch this, return empty or throw
        return new PaginatedResponse([], 0, page, limit);
      }
      tenantId = tenant.userId;
    }

    if (invoiceId) where.invoiceId = invoiceId;
    if (tenantId) where.tenantId = tenantId;
    if (landlordId) {
      where.invoice = {
        contract: {
          room: {
            property: {
              landlordId: landlordId,
            },
          },
        },
      };
    }
    if (status) where.status = status;
    if (paymentMethod) where.paymentMethod = paymentMethod;
    if (search) {
      where.transactionId = { contains: search, mode: 'insensitive' };
    }

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        include: landlordId
          ? {
              invoice: {
                include: {
                  contract: {
                    include: {
                      room: {
                        include: {
                          property: true,
                        },
                      },
                    },
                  },
                },
              },
            }
          : undefined,
        skip: filterDto.skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.payment.count({ where }),
    ]);

    // Convert Decimal to Number
    const cleaned = payments.map((p) => ({
      ...p,
      amount: p.amount ? Number(p.amount) : 0,
    }));

    const transformed = cleaned.map((payment) =>
      plainToClass(PaymentResponseDto, payment, {
        excludeExtraneousValues: true,
      }),
    );

    return new PaginatedResponse(transformed, total, page, limit);
  }

  async findOne(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    // Convert Decimal to Number
    const cleaned = {
      ...payment,
      amount: payment.amount ? Number(payment.amount) : 0,
    };

    return plainToClass(PaymentResponseDto, cleaned, {
      excludeExtraneousValues: true,
    });
  }

  async update(id: string, updatePaymentDto: UpdatePaymentDto, user?: User) {
    // Fetch payment with invoice and contract details for ownership validation
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        invoice: {
          include: {
            contract: {
              include: {
                room: {
                  include: {
                    property: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    // 🔒 SECURITY: Ownership validation for landlords
    // Admins can update any payment, but landlords can only update payments for their own contracts
    if (user && user.role === UserRole.LANDLORD) {
      const landlordId = payment.invoice?.contract?.room?.property?.landlordId;
      if (landlordId !== user.id) {
        throw new ForbiddenException(
          'You can only update payments for your own contracts',
        );
      }
    }

    await this.immutability.enforceImmutability(
      'PAYMENT',
      id,
      payment.status,
      updatePaymentDto,
      user?.id || 'SYSTEM',
    );

    if (
      updatePaymentDto.status &&
      (updatePaymentDto.status as any) !== payment.status
    ) {
      this.stateMachine.validateTransition(
        'PAYMENT',
        id,
        payment.status,
        updatePaymentDto.status,
        user?.id || 'SYSTEM',
        'Manual status update',
      );
    }

    const updated = await this.prisma.payment.update({
      where: { id },
      data: updatePaymentDto,
    });

    // Convert Decimal to Number
    const cleaned = {
      ...updated,
      amount: updated.amount ? Number(updated.amount) : 0,
    };

    return plainToClass(PaymentResponseDto, cleaned, {
      excludeExtraneousValues: true,
    });
  }

  async confirmPayment(id: string, user?: User) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: { invoice: true },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    this.stateMachine.validateTransition(
      'PAYMENT',
      id,
      payment.status,
      PaymentStatus.COMPLETED,
      user?.id || 'SYSTEM',
      'Manual confirmation',
    );

    if (payment.invoice) {
      this.stateMachine.validateTransition(
        'INVOICE',
        payment.invoiceId,
        payment.invoice.status,
        'PAID',
        user?.id || 'SYSTEM',
        'Payment confirmed',
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const previousEvents = await this.eventStore.getEventStream(
        id,
        'PAYMENT',
      );
      const correlationId = previousEvents[0]?.correlationId || uuidv4();
      const causationId = previousEvents[previousEvents.length - 1]?.eventId;

      const paymentRecord = await tx.payment.update({
        where: { id },
        data: {
          status: PaymentStatus.COMPLETED,
          paidAt: new Date(),
        },
      });

      await this.eventStore.append({
        eventId: uuidv4(),
        eventType: 'PAYMENT_COMPLETED',
        correlationId,
        causationId,
        aggregateId: id,
        aggregateType: 'PAYMENT',
        aggregateVersion: previousEvents.length + 1,
        payload: {
          paymentId: id,
          previousStatus: payment.status,
          newStatus: PaymentStatus.COMPLETED,
          paidAt: paymentRecord.paidAt,
        },
        metadata: {
          userId: user?.id || 'SYSTEM',
          userRole: user?.role || 'SYSTEM',
          timestamp: new Date(),
          source: 'API',
        },
      });

      if (payment.invoice) {
        const invoiceEvents = await this.eventStore.getEventStream(
          payment.invoiceId,
          'INVOICE',
        );

        await tx.invoice.update({
          where: { id: payment.invoiceId },
          data: {
            status: 'PAID',
            paidAt: new Date(),
          },
        });

        await this.eventStore.append({
          eventId: uuidv4(),
          eventType: 'INVOICE_PAID',
          correlationId,
          causationId: invoiceEvents[invoiceEvents.length - 1]?.eventId,
          aggregateId: payment.invoiceId,
          aggregateType: 'INVOICE',
          aggregateVersion: invoiceEvents.length + 1,
          payload: {
            invoiceId: payment.invoiceId,
            amount: payment.amount,
            paidAt: new Date().toISOString(),
          },
          metadata: {
            userId: user?.id || 'SYSTEM',
            userRole: user?.role || 'SYSTEM',
            timestamp: new Date(),
            source: 'API',
          },
        });
      }

      return paymentRecord;
    });

    const cleaned = {
      ...updated,
      amount: updated.amount ? Number(updated.amount) : 0,
    };

    return plainToClass(PaymentResponseDto, cleaned, {
      excludeExtraneousValues: true,
    });
  }

  async remove(id: string, user?: User) {
    // Fetch payment with invoice and contract details for ownership validation
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        invoice: {
          include: {
            contract: {
              include: {
                room: {
                  include: {
                    property: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    // 🔒 SECURITY: Ownership validation for landlords
    // Admins can delete any payment, but landlords can only delete payments for their own contracts
    if (user && user.role === UserRole.LANDLORD) {
      const landlordId = payment.invoice?.contract?.room?.property?.landlordId;
      if (landlordId !== user.id) {
        throw new ForbiddenException(
          'You can only delete payments for your own contracts',
        );
      }
    }

    if (this.immutability.isFrozen('PAYMENT', payment.status)) {
      throw new BadRequestException(
        'Completed/refunded payments cannot be deleted. Create a reversal instead.',
      );
    }

    await this.prisma.payment.delete({
      where: { id },
    });

    return { message: 'Payment deleted successfully' };
  }

  async checkPaymentStatus(
    id: string,
    user?: User,
  ): Promise<PaymentVerificationResult> {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        invoice: {
          include: {
            contract: {
              include: {
                room: {
                  include: {
                    property: {
                      include: {
                        // Need payment config or landlord info?
                        // PaymentService fetches it internally via landlordId or contract
                        landlord: true,
                      },
                    },
                  },
                },
                tenant: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    if (payment.status === PaymentStatus.COMPLETED) {
      return { success: true, error: 'Payment already completed' };
    }

    const contract = payment.invoice?.contract;
    if (!contract) {
      return { success: false, error: 'Payment is not linked to a contract' };
    }

    // Verify
    const amount = Number(payment.amount);
    const result = await this.paymentFacade.verifyPayment(contract, amount);

    if (result.success) {
      if (payment.invoice) {
        this.stateMachine.validateTransition(
          'INVOICE',
          payment.invoiceId,
          payment.invoice.status,
          'PAID',
          user?.id || 'SYSTEM',
          'Gateway verification',
        );
      }

      this.stateMachine.validateTransition(
        'PAYMENT',
        id,
        payment.status,
        PaymentStatus.COMPLETED,
        user?.id || 'SYSTEM',
        'Gateway verification',
      );

      await this.prisma.$transaction(async (tx) => {
        const previousEvents = await this.eventStore.getEventStream(
          id,
          'PAYMENT',
        );
        const correlationId = previousEvents[0]?.correlationId || uuidv4();
        const causationId = previousEvents[previousEvents.length - 1]?.eventId;

        await tx.payment.update({
          where: { id },
          data: {
            status: PaymentStatus.COMPLETED,
            paidAt: new Date(),
          },
        });

        await this.eventStore.append({
          eventId: uuidv4(),
          eventType: 'PAYMENT_COMPLETED',
          correlationId,
          causationId,
          aggregateId: id,
          aggregateType: 'PAYMENT',
          aggregateVersion: previousEvents.length + 1,
          payload: {
            paymentId: id,
            previousStatus: payment.status,
            newStatus: PaymentStatus.COMPLETED,
            paidAt: new Date().toISOString(),
          },
          metadata: {
            userId: user?.id || 'SYSTEM',
            userRole: user?.role || 'SYSTEM',
            timestamp: new Date(),
            source: 'API',
          },
        });

        if (payment.invoiceId) {
          const invoiceEvents = await this.eventStore.getEventStream(
            payment.invoiceId,
            'INVOICE',
          );

          await tx.invoice.update({
            where: { id: payment.invoiceId },
            data: {
              status: 'PAID',
              paidAt: new Date(),
            },
          });

          await this.eventStore.append({
            eventId: uuidv4(),
            eventType: 'INVOICE_PAID',
            correlationId,
            causationId: invoiceEvents[invoiceEvents.length - 1]?.eventId,
            aggregateId: payment.invoiceId,
            aggregateType: 'INVOICE',
            aggregateVersion: invoiceEvents.length + 1,
            payload: {
              invoiceId: payment.invoiceId,
              amount: payment.amount,
              paidAt: new Date().toISOString(),
            },
            metadata: {
              userId: user?.id || 'SYSTEM',
              userRole: user?.role || 'SYSTEM',
              timestamp: new Date(),
              source: 'API',
            },
          });
        }
      });
    }

    return result;
  }
}
