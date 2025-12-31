import { Injectable, NotFoundException } from '@nestjs/common';
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

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) { }

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

  async update(id: string, updatePaymentDto: UpdatePaymentDto) {
    await this.findOne(id);

    const payment = await this.prisma.payment.update({
      where: { id },
      data: updatePaymentDto,
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

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.payment.delete({
      where: { id },
    });

    return { message: 'Payment deleted successfully' };
  }
}
