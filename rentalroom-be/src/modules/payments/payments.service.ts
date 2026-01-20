import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import {
  CreatePaymentDto,
  UpdatePaymentDto,
  FilterPaymentsDto,
  PaymentResponseDto,
} from './dto';
import { PaginatedResponse } from 'src/shared/dtos';
import { plainToClass } from 'class-transformer';
import { PaymentStatus } from './entities';
import { PaymentService } from './payment.service';
import { PaymentVerificationResult } from './interfaces';
import { User, UserRole } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentFacade: PaymentService,
  ) {}

  async create(createPaymentDto: CreatePaymentDto) {
    const payment = await this.prisma.payment.create({
      data: createPaymentDto,
    });

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

  async confirmPayment(id: string) {
    await this.findOne(id);

    const payment = await this.prisma.payment.update({
      where: { id },
      data: {
        status: PaymentStatus.COMPLETED,
        paidAt: new Date(),
      },
    });

    // Convert Decimal to Number
    const cleaned = {
      ...payment,
      amount: payment.amount ? Number(payment.amount) : 0,
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

    await this.prisma.payment.delete({
      where: { id },
    });

    return { message: 'Payment deleted successfully' };
  }

  async checkPaymentStatus(id: string): Promise<PaymentVerificationResult> {
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
      // Update status
      await this.prisma.payment.update({
        where: { id },
        data: {
          status: PaymentStatus.COMPLETED,
          paidAt: new Date(),
        },
      });

      // Update Invoice status too if needed
      if (payment.invoiceId) {
        await this.prisma.invoice.update({
          where: { id: payment.invoiceId },
          data: {
            status: 'PAID',
            paidAt: new Date(),
          },
        });
      }
    }

    return result;
  }
}
