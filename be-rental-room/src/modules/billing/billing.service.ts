import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities';
import { IncomeService } from '../income/income.service';
import { IncomeType } from '../income/entities/income.entity';
import { SnapshotService } from '../snapshots/snapshot.service';
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
import { UserRole } from '../users/entities';
import {
  PaymentMethod,
  PaymentStatus,
} from '../payments/entities/payment.entity';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly incomeService: IncomeService,
    private readonly snapshotService: SnapshotService,
  ) { }

  async createInvoice(createInvoiceDto: CreateInvoiceDto, actor: { id: string; role: UserRole }) {
    const invoice = await this.prisma.invoice.create({
      data: createInvoiceDto,
      include: {
        contract: {
          include: {
            tenant: true,
            room: true,
            landlord: true,
          },
        },
      },
    });

    // 📸 CREATE SNAPSHOT: Invoice Issued
    try {
      const snapshotId = await this.snapshotService.create({
        actorId: actor.id,
        actorRole: actor.role,
        actionType: 'INVOICE_ISSUED',
        entityType: 'INVOICE',
        entityId: invoice.id,
        metadata: {
          invoiceNumber: invoice.invoiceNumber,
          totalAmount: Number(invoice.totalAmount),
          items: await this.prisma.invoiceLineItem.findMany({ where: { invoiceId: invoice.id } }),
        },
      });

      // Update invoice with snapshotId
      await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: { snapshotId },
      });
    } catch (error) {
      this.logger.error('Failed to create snapshot for invoice', error);
      // Non-blocking
    }

    // 🔔 TRIGGER NOTIFICATION: Invoice Generated
    try {
      await this.notificationsService.create({
        userId: invoice.contract.tenantId,
        title: 'Hóa đơn mới đã được tạo',
        content: `Hóa đơn ${invoice.invoiceNumber} cho phòng ${invoice.contract.room.roomNumber} với số tiền ${Number(invoice.totalAmount).toLocaleString('vi-VN')} VNĐ. Hạn thanh toán: ${new Date(invoice.dueDate).toLocaleDateString('vi-VN')}`,
        notificationType: NotificationType.PAYMENT,
        relatedEntityId: invoice.id,
      });
      this.logger.log(`📬 Invoice notification sent to tenant ${invoice.contract.tenantId}`);
    } catch (error) {
      this.logger.error('Failed to send invoice notification', error);
    }

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
      landlordId, // 🔒 SECURITY: Filter by landlord
      status,
      search,
    } = filterDto;

    const where: any = {};

    if (contractId) where.contractId = contractId;
    if (tenantId) where.tenantId = tenantId;
    if (status) where.status = status;

    // 🔒 SECURITY: Filter by landlordId via contract relationship
    if (landlordId) {
      where.contract = {
        landlordId: landlordId,
      };
    }

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
          lineItems: true,
          contract: {
            include: {
              tenant: {
                include: {
                  user: true,
                },
              },
              room: true,
            },
          },
        },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    const transformed = invoices.map((invoice) => ({
      ...invoice,
      totalAmount: invoice.totalAmount ? Number(invoice.totalAmount) : 0,
      lineItems: invoice.lineItems.map((item) => ({
        ...item,
        unitPrice: item.unitPrice ? Number(item.unitPrice) : 0,
        amount: item.amount ? Number(item.amount) : 0,
      })),
    }));

    return new PaginatedResponse(transformed, total, page, limit);
  }

  async findOneInvoice(id: string, user?: any) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        lineItems: true,
        contract: {
          include: {
            landlord: {
              include: {
                user: true,
              },
            },
            tenant: {
              include: {
                user: true,
              },
            },
            room: true,
          },
        },
        _count: {
          select: { lineItems: true },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    // If user is TENANT, verify they own this invoice
    if (user && user.role === UserRole.TENANT) {
      const tenantId = user.id || user.tenantId;
      if (invoice.tenantId !== tenantId && invoice.contract?.tenantId !== tenantId) {
        throw new NotFoundException(
          `Invoice with ID ${id} not found or you don't have access to this invoice`,
        );
      }
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

  async markAsPaid(id: string, user?: any) {
    const invoice = await this.findOneInvoice(id, user);

    // Verify ownership if user is TENANT
    if (user && user.role === 'TENANT') {
      if (invoice.tenantId !== user.id) {
        throw new ForbiddenException(
          'You can only mark your own invoices as paid',
        );
      }
    }

    const updatedInvoice = await this.prisma.invoice.update({
      where: { id },
      data: {
        status: InvoiceStatus.PAID,
        paidAt: new Date(),
      },
      include: {
        contract: {
          include: {
            landlord: true,
            room: true,
          },
        },
      },
    });

    // 📸 CREATE SNAPSHOT: Invoice Paid
    try {
      const snapshotId = await this.snapshotService.create({
        actorId: user ? user.id : updatedInvoice.contract.landlordId, // Use user ID or Landlord ID
        actorRole: user ? user.role : UserRole.LANDLORD,
        actionType: 'INVOICE_PAID',
        entityType: 'INVOICE',
        entityId: updatedInvoice.id,
        metadata: {
          invoiceNumber: updatedInvoice.invoiceNumber,
          paidAt: updatedInvoice.paidAt,
          totalAmount: Number(updatedInvoice.totalAmount),
        },
      });
      // Update invoice with snapshotId (Latest snapshot)
      await this.prisma.invoice.update({
        where: { id: updatedInvoice.id },
        data: { snapshotId },
      });
    } catch (error) {
      this.logger.error('Failed to create snapshot for invoice payment', error);
    }

    // 💰 AUTO-CREATE INCOME: Invoice Paid
    try {
      const paidDate = new Date();
      await this.incomeService.create(
        {
          rentalUnitId: updatedInvoice.contract.roomId,
          tenantId: updatedInvoice.tenantId,
          amount: Number(updatedInvoice.totalAmount),
          incomeType: IncomeType.RENTAL, // From invoice
          receivedAt: paidDate.toISOString(),
          paymentMethod: 'BANK_TRANSFER', // Default
          note: `Thu từ hóa đơn ${updatedInvoice.invoiceNumber}`,
        },
        updatedInvoice.contract.landlordId,
      );
      this.logger.log(`💰 Auto-created income for invoice ${updatedInvoice.invoiceNumber}`);
    } catch (error) {
      this.logger.error('Failed to auto-create income', error);
      // Don't fail the invoice payment if income creation fails
    }

    // Convert Decimal to Number
    const cleaned = {
      ...updatedInvoice,
      totalAmount: updatedInvoice.totalAmount
        ? Number(updatedInvoice.totalAmount)
        : 0,
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

  /**
   * Get utility billing for tenant (services and meter readings)
   */
  async getUtilityBilling(tenantId: string, month: string) {
    // Find tenant's active contract
    const contract = await this.prisma.contract.findFirst({
      where: {
        tenantId,
        status: 'ACTIVE',
      },
      include: {
        room: {
          include: {
            property: {
              include: {
                services: true,
              },
            },
          },
        },
      },
    });

    if (!contract) {
      return {
        contract: null,
        services: [],
        latestReadings: [],
        totalAmount: 0,
      };
    }

    // Get meter readings for the month
    const readings = await this.prisma.meterReading.findMany({
      where: {
        contractId: contract.id,
        month,
      },
    });

    // Get all metered services
    const services = contract.room.property.services.filter(
      (s: any) => s.billingMethod === 'METERED',
    );

    // Calculate total from readings
    const totalAmount = readings.reduce((sum, r) => sum + Number(r.amount), 0);

    return {
      contract,
      services,
      latestReadings: readings,
      totalAmount,
    };
  }

  /**
   * Get last meter readings for tenant
   */
  async getLastReadings(tenantId: string) {
    // Find tenant's active contract
    const contract = await this.prisma.contract.findFirst({
      where: {
        tenantId,
        status: 'ACTIVE',
      },
    });

    if (!contract) {
      return [];
    }

    // Get latest reading for each service
    const readings = await this.prisma.meterReading.findMany({
      where: {
        contractId: contract.id,
      },
      orderBy: { createdAt: 'desc' },
      distinct: ['serviceId'],
    });

    return readings;
  }

  /**
   * Submit meter readings for utilities (LANDLORD)
   */
  async submitMeterReadingsForLandlord(dto: {
    contractId: string;
    month: string;
    readings: Array<{ serviceId: string; currentReading: number }>;
  }) {
    // Verify contract exists
    const contract = await this.prisma.contract.findUnique({
      where: { id: dto.contractId },
      include: {
        room: {
          include: {
            property: {
              include: {
                services: true,
              },
            },
          },
        },
      },
    });

    if (!contract) {
      throw new NotFoundException(`Contract ${dto.contractId} not found`);
    }

    const createdReadings: any[] = [];

    for (const reading of dto.readings) {
      // Get service info
      const service = contract.room.property.services.find(
        (s: any) => s.id === reading.serviceId,
      );

      if (!service) {
        throw new NotFoundException(`Service ${reading.serviceId} not found`);
      }

      if (service.billingMethod !== 'METERED') {
        throw new Error(
          `Service ${service.serviceName} is not a metered service`,
        );
      }

      // Check if reading for this month already exists
      const existingReading = await this.prisma.meterReading.findUnique({
        where: {
          contractId_serviceId_month: {
            contractId: dto.contractId,
            serviceId: reading.serviceId,
            month: dto.month,
          },
        },
      });

      // Get previous reading
      const previousReading = await this.prisma.meterReading.findFirst({
        where: {
          serviceId: reading.serviceId,
          contractId: dto.contractId,
        },
        orderBy: { month: 'desc' },
      });

      const prevValue = previousReading
        ? Number(previousReading.currentReading)
        : 0;
      const usage = reading.currentReading - prevValue;

      if (usage < 0) {
        throw new Error(
          `Invalid reading: current reading cannot be less than previous reading for ${service.serviceName}`,
        );
      }

      const amount = Number((usage * Number(service.unitPrice)).toFixed(2));

      if (existingReading) {
        // Update existing reading
        const updated = await this.prisma.meterReading.update({
          where: { id: existingReading.id },
          data: {
            currentReading: reading.currentReading,
            usage,
            amount,
            updatedAt: new Date(),
          },
        });
        createdReadings.push(updated);
      } else {
        // Create new reading
        const meterReading = await this.prisma.meterReading.create({
          data: {
            serviceId: reading.serviceId,
            contractId: dto.contractId,
            month: dto.month,
            previousReading: prevValue,
            currentReading: reading.currentReading,
            usage,
            amount,
          },
          include: {
            service: true,
          },
        });
        createdReadings.push(meterReading);
      }
    }

    return {
      contractId: dto.contractId,
      month: dto.month,
      readings: createdReadings,
      totalAmount: createdReadings.reduce(
        (sum, r) => sum + Number(r.amount),
        0,
      ),
    };
  }

  /**
   * Get meter readings for a contract
   */
  async getMeterReadings(contractId: string, month?: string) {
    const where: any = { contractId };
    if (month) {
      where.month = month;
    }

    const readings = await this.prisma.meterReading.findMany({
      where,
      include: {
        service: true,
      },
      orderBy: [{ month: 'desc' }, { createdAt: 'desc' }],
    });

    return readings;
  }

  /**
   * Get utility billing for tenant (services and meter readings) - ALIAS
   */
  async getTenantUtilityBilling(tenantId: string, month: string) {
    return this.getUtilityBilling(tenantId, month);
  }

  /**
   * Get last meter readings for tenant - ALIAS
   */
  async getTenantLastReadings(tenantId: string) {
    return this.getLastReadings(tenantId);
  }

  /**
   * Submit meter readings for utilities (TENANT - deprecated in favor of landlord submission)
   */
  async submitMeterReadings(
    tenantId: string,
    dto: {
      month: string;
      readings: Array<{ serviceId: string; currentReading: number }>;
    },
  ) {
    // Find tenant's active contract
    const contract = await this.prisma.contract.findFirst({
      where: {
        tenantId,
        status: 'ACTIVE',
      },
    });

    if (!contract) {
      throw new NotFoundException('No active contract found for this tenant');
    }

    return this.submitMeterReadingsForLandlord({
      contractId: contract.id,
      month: dto.month,
      readings: dto.readings,
    });
  }

  /**
   * Generate utility invoice from meter readings
   * Creates an invoice with line items for each metered service
   */
  async generateUtilityInvoice(
    contractId: string,
    month: string,
    user?: any,
    options?: {
      readings?: Array<{ serviceId: string; currentReading: number }>;
      includeRent?: boolean;
      includeFixedServices?: boolean;
    },
  ) {
    // 1. Optional: Submit readings if provided
    if (options?.readings && options.readings.length > 0) {
      await this.submitMeterReadingsForLandlord({
        contractId,
        month,
        readings: options.readings,
      });
    }

    // Verify contract exists
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        tenant: true,
        room: {
          include: {
            property: {
              include: {
                landlord: true,
                services: true,
              },
            },
          },
        },
      },
    });

    if (!contract) {
      throw new NotFoundException(`Contract ${contractId} not found`);
    }

    // Verify landlord owns this property
    if (user && user.role === UserRole.LANDLORD) {
      if (contract.room.property.landlordId !== user.id) {
        throw new NotFoundException(
          `Contract ${contractId} not found or you don't have permission to generate invoices for this contract`,
        );
      }
    }

    // Check if invoice already exists for this month
    // Updated check to be more specific or allow regeneration? 
    // For now, strict check to prevent duplicates
    const existingInvoice = await this.prisma.invoice.findFirst({
      where: {
        contractId,
        invoiceNumber: { contains: `UTL-${month}` },
      },
    });

    if (existingInvoice) {
      throw new Error(
        `Invoice already exists for contract ${contractId} in month ${month}`,
      );
    }

    // --- CALCULATE LINE ITEMS ---
    const lineItemsToCreate: any[] = [];
    let totalAmount = 0;

    // A. Metered Services (from Readings)
    // Get all meter readings for this contract and month
    const readings = await this.prisma.meterReading.findMany({
      where: {
        contractId,
        month,
      },
      include: {
        service: true,
      },
    });

    // Note: If no metered services exist and no readings, that's fine IF we have rent/fixed services.
    // If we only have metered services and no readings, throw error.
    const hasMeteredServices = contract.room.property.services.some(s => s.billingMethod === 'METERED');
    if (hasMeteredServices && readings.length === 0 && !options?.includeRent && !options?.includeFixedServices) {
      // Fallback to old behavior: if purely utility invoice and no readings, error.
      // But if we have rent, we allow it.
      // For safety, warn if readings missing for metered services? 
      // We'll proceed.
    }

    for (const reading of readings) {
      const amount = Number(reading.amount);
      totalAmount += amount;
      lineItemsToCreate.push({
        serviceId: reading.serviceId,
        itemType: 'UTILITY',
        description: `${reading.service.serviceName} - ${Number(reading.usage).toLocaleString('vi-VN')} ${reading.service.unit} × ${Number(reading.service.unitPrice).toLocaleString('vi-VN')} ₫/đơn vị`,
        quantity: Number(reading.usage),
        unitPrice: Number(reading.service.unitPrice),
        amount: amount,
      });
    }

    // B. Rent (if enabled) - Default true
    if (options?.includeRent !== false) {
      const rentAmount = Number(contract.monthlyRent);
      if (rentAmount > 0) {
        totalAmount += rentAmount;
        lineItemsToCreate.push({
          itemType: 'RENT',
          description: `Tiền thuê phòng tháng ${month}`,
          quantity: 1,
          unitPrice: rentAmount,
          amount: rentAmount,
        });
      }
    }

    // C. Fixed Services (if enabled) - Default true
    if (options?.includeFixedServices !== false) {
      const fixedServices = contract.room.property.services.filter(s => s.billingMethod === 'FIXED');
      for (const s of fixedServices) {
        const sAmount = Number(s.unitPrice);
        totalAmount += sAmount;
        lineItemsToCreate.push({
          serviceId: s.id,
          itemType: 'SERVICE',
          description: `${s.serviceName} (Phí cố định)`,
          quantity: 1,
          unitPrice: sAmount,
          amount: sAmount,
        });
      }
    }

    if (totalAmount === 0) {
      throw new Error('Cannot generate invoice with 0 total amount');
    }

    // --- PERSIST ---

    // Create invoice
    const invoice = await this.prisma.invoice.create({
      data: {
        contractId,
        tenantId: contract.tenantId,
        invoiceNumber: `UTL-${month}-${contractId.substring(0, 8)}`,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days due
        totalAmount,
        status: InvoiceStatus.PENDING,
      },
    });

    // Create line items
    for (const item of lineItemsToCreate) {
      await this.prisma.invoiceLineItem.create({
        data: {
          invoiceId: invoice.id,
          ...item,
        },
      });
    }

    return {
      invoice: {
        ...invoice,
        totalAmount: Number(invoice.totalAmount),
      },
      readings: readings.map(r => ({
        ...r,
        amount: Number(r.amount),
        usage: Number(r.usage),
        service: {
          ...r.service,
          unitPrice: Number(r.service.unitPrice),
        }
      })),
      totalAmount,
      lineItemCount: lineItemsToCreate.length,
    };
  }

  /**
   * Get all utility invoices for a tenant
   * Filtered and paginated
   */
  async getUtilityInvoicesForTenant(tenantId: string, month?: string) {
    const where: any = {
      tenantId,
      invoiceNumber: {
        contains: 'UTL-',
      },
      deletedAt: null,
    };

    if (month) {
      where.invoiceNumber.contains = `UTL-${month}`;
    }

    const invoices = await this.prisma.invoice.findMany({
      where,
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
        lineItems: {
          include: {
            service: true,
          },
        },
        payments: true,
      },
      orderBy: {
        dueDate: 'desc',
      },
    });

    return invoices.map((invoice) => ({
      ...invoice,
      totalAmount: Number(invoice.totalAmount),
      lineItems: invoice.lineItems.map((item) => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        amount: Number(item.amount),
      })),
      payments: invoice.payments.map((p) => ({
        ...p,
        amount: Number(p.amount),
      })),
    }));
  }

  /**
   * Record a utility invoice payment
   * Mark invoice as PAID and update payment status
   */
  async recordUtilityPayment(
    invoiceId: string,
    amount: number,
    paymentMethod: PaymentMethod,
    user?: any,
  ) {
    // Get invoice with ownership check
    const invoice = await this.findOneInvoice(invoiceId, user);

    if (invoice.status === InvoiceStatus.PAID) {
      throw new Error(
        `Invoice ${invoiceId} is already paid. Cannot record additional payment.`,
      );
    }

    if (amount > Number(invoice.totalAmount)) {
      throw new Error(
        `Payment amount cannot exceed invoice total. Invoice total: ${Number(invoice.totalAmount)}, Payment amount: ${amount}`,
      );
    }

    // Create payment record
    const payment = await this.prisma.payment.create({
      data: {
        invoiceId,
        tenantId: invoice.tenantId,
        amount,
        paymentMethod,
        status: PaymentStatus.COMPLETED,
        paidAt: new Date(),
      },
    });

    // Calculate remaining amount
    const paidTotal = await this.prisma.payment.aggregate({
      where: {
        invoiceId,
        deletedAt: null,
      },
      _sum: {
        amount: true,
      },
    });

    const totalPaid = Number(paidTotal._sum.amount || 0);
    const invoiceTotal = Number(invoice.totalAmount);

    // Update invoice status
    let newStatus = InvoiceStatus.PENDING;
    if (totalPaid >= invoiceTotal) {
      newStatus = InvoiceStatus.PAID;
    } else if (totalPaid > 0) {
      newStatus = InvoiceStatus.OVERDUE;
    }

    const updatedInvoice = await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: newStatus,
        paidAt: newStatus === InvoiceStatus.PAID ? new Date() : null,
      },
      include: {
        payments: true,
        lineItems: true,
      },
    });

    return {
      payment: {
        ...payment,
        amount: Number(payment.amount),
      },
      invoice: {
        ...updatedInvoice,
        totalAmount: Number(updatedInvoice.totalAmount),
        lineItems: updatedInvoice.lineItems.map((item) => ({
          ...item,
          amount: Number(item.amount),
        })),
      },
    };
  }


  /**
   * Get all utility invoices for a landlord
   * Returns invoices for all properties owned by the landlord
   */
  async getUtilityInvoicesForLandlord(landlordId: string, month?: string) {
    // Find all properties owned by landlord
    const properties = await this.prisma.property.findMany({
      where: { landlordId },
      select: { id: true },
    });

    const propertyIds = properties.map((p) => p.id);

    // Find all contracts for these properties
    const contracts = await this.prisma.contract.findMany({
      where: {
        room: {
          propertyId: { in: propertyIds },
        },
      },
      select: { id: true },
    });

    const contractIds = contracts.map((c) => c.id);

    // Build where clause
    const where: any = {
      contractId: { in: contractIds },
      invoiceNumber: {
        contains: 'UTL-',
      },
      deletedAt: null,
    };

    if (month) {
      where.invoiceNumber.contains = `UTL-${month}`;
    }

    // Fetch invoices
    const invoices = await this.prisma.invoice.findMany({
      where,
      include: {
        contract: {
          include: {
            tenant: {
              include: {
                user: true,
              },
            },
            room: {
              include: {
                property: true,
              },
            },
          },
        },
        lineItems: {
          include: {
            service: true,
          },
        },
        payments: true,
      },
      orderBy: {
        dueDate: 'desc',
      },
    });

    return invoices.map((invoice) => ({
      ...invoice,
      totalAmount: Number(invoice.totalAmount),
      lineItems: invoice.lineItems.map((item) => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        amount: Number(item.amount),
      })),
      payments: invoice.payments.map((p) => ({
        ...p,
        amount: Number(p.amount),
      })),
    }));
  }
}

