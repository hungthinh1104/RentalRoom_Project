import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import {
  CreateInvoiceDto,
  CreateInvoiceLineItemDto,
  UpdateInvoiceDto,
  FilterInvoicesDto,
  InvoiceResponseDto,
} from './dto';
import { PaginatedResponse } from 'src/shared/dtos';
import { plainToClass } from 'class-transformer';
import { InvoiceStatus } from './entities';

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  async createInvoice(createInvoiceDto: CreateInvoiceDto) {
    const invoice = await this.prisma.invoice.create({
      data: createInvoiceDto,
    });

    // Convert Decimal to Number
    const cleaned = {
      ...invoice,
      totalAmount: invoice.totalAmount ? Number(invoice.totalAmount) : 0,
    };

    return plainToClass(InvoiceResponseDto, cleaned, {
      excludeExtraneousValues: true,
    });
  }

  async addLineItem(
    invoiceId: string,
    createLineItemDto: CreateInvoiceLineItemDto,
  ) {
    const lineItem = await this.prisma.invoiceLineItem.create({
      data: {
        ...createLineItemDto,
        invoiceId,
      },
    });

    // Recalculate invoice total
    const total = await this.prisma.invoiceLineItem.aggregate({
      where: { invoiceId },
      _sum: { amount: true },
    });

    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { totalAmount: total._sum.amount || 0 },
    });

    // Convert Decimal to Number for line item
    const cleanedLineItem = {
      ...lineItem,
      quantity: lineItem.quantity ? Number(lineItem.quantity) : 0,
      unitPrice: lineItem.unitPrice ? Number(lineItem.unitPrice) : 0,
      amount: lineItem.amount ? Number(lineItem.amount) : 0,
    };

    return cleanedLineItem;
  }

  async findAllInvoices(filterDto: FilterInvoicesDto) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'issueDate',
      sortOrder = 'desc',
      contractId,
      tenantId,
      status,
      search,
    } = filterDto;

    const where: any = {};

    if (contractId) where.contractId = contractId;
    if (tenantId) where.tenantId = tenantId;
    if (status) where.status = status;
    if (search) {
      where.invoiceNumber = { contains: search, mode: 'insensitive' };
    }

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip: filterDto.skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: { lineItems: true },
          },
        },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    // Convert Decimal to Number
    const cleaned = invoices.map((invoice) => ({
      ...invoice,
      totalAmount: invoice.totalAmount ? Number(invoice.totalAmount) : 0,
      lineItemCount: invoice._count.lineItems,
    }));

    const transformed = cleaned.map((invoice) =>
      plainToClass(InvoiceResponseDto, invoice, {
        excludeExtraneousValues: true,
      }),
    );

    return new PaginatedResponse(transformed, total, page, limit);
  }

  async findOneInvoice(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        lineItems: true,
        _count: {
          select: { lineItems: true },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    // Convert Decimal to Number
    const cleaned = {
      ...invoice,
      totalAmount: invoice.totalAmount ? Number(invoice.totalAmount) : 0,
      lineItems: invoice.lineItems.map((item) => ({
        ...item,
        quantity: item.quantity ? Number(item.quantity) : 0,
        unitPrice: item.unitPrice ? Number(item.unitPrice) : 0,
        amount: item.amount ? Number(item.amount) : 0,
      })),
      lineItemCount: invoice._count.lineItems,
    };

    return plainToClass(InvoiceResponseDto, cleaned, {
      excludeExtraneousValues: true,
    });
  }

  async updateInvoice(id: string, updateDto: UpdateInvoiceDto) {
    await this.findOneInvoice(id);

    const invoice = await this.prisma.invoice.update({
      where: { id },
      data: updateDto,
    });

    // Convert Decimal to Number
    const cleaned = {
      ...invoice,
      totalAmount: invoice.totalAmount ? Number(invoice.totalAmount) : 0,
    };

    return plainToClass(InvoiceResponseDto, cleaned, {
      excludeExtraneousValues: true,
    });
  }

  async markAsPaid(id: string) {
    await this.findOneInvoice(id);

    const invoice = await this.prisma.invoice.update({
      where: { id },
      data: {
        status: InvoiceStatus.PAID,
        paidAt: new Date(),
      },
    });

    // Convert Decimal to Number
    const cleaned = {
      ...invoice,
      totalAmount: invoice.totalAmount ? Number(invoice.totalAmount) : 0,
    };

    return plainToClass(InvoiceResponseDto, cleaned, {
      excludeExtraneousValues: true,
    });
  }

  async removeInvoice(id: string) {
    await this.findOneInvoice(id);

    await this.prisma.invoice.delete({
      where: { id },
    });

    return { message: 'Invoice deleted successfully' };
  }
}
