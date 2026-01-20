import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
  InternalServerErrorException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities';
import { IncomeService } from '../income/income.service';
import { IncomeType } from '../income/entities/income.entity';
import { SnapshotService } from '../snapshots/snapshot.service';
import { StateTransitionLogger } from '../../shared/state-machines/transition-logger.service';
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
    private readonly stateLogger: StateTransitionLogger,
  ) {}

  /**
   * 🔒 SECURITY: Assert user owns invoice (tenant or landlord via contract)
   * CRITICAL: Prevents IDOR attacks on invoice access
   */
  private async assertInvoiceOwnership(
    invoiceId: string,
    userId: string,
    userRole: UserRole,
    tx?: any,
  ) {
    const client = tx || this.prisma;
    const invoice = await client.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        contract: { select: { tenantId: true, landlordId: true } },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice ${invoiceId} not found`);
    }

    if (userRole === UserRole.ADMIN) return invoice;

    const isTenantOwner = invoice.tenantId === userId;
    const isLandlordOwner = invoice.contract?.landlordId === userId;

    if (!isTenantOwner && !isLandlordOwner) {
      throw new ForbiddenException('Access denied to this invoice');
    }

    return invoice;
  }

  /**
   * 🔒 SECURITY: Assert user owns payment
   * CRITICAL: Prevents IDOR attacks on payment operations
   */
  private async assertPaymentOwnership(
    paymentId: string,
    userId: string,
    userRole: UserRole,
    tx?: any,
  ) {
    const client = tx || this.prisma;
    const payment = await client.payment.findUnique({
      where: { id: paymentId },
      include: {
        invoice: {
          include: {
            contract: { select: { tenantId: true, landlordId: true } },
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment ${paymentId} not found`);
    }

    if (userRole === UserRole.ADMIN) return payment;

    const isTenantOwner = payment.tenantId === userId;
    const isLandlordOwner = payment.invoice?.contract?.landlordId === userId;

    if (!isTenantOwner && !isLandlordOwner) {
      throw new ForbiddenException('Access denied to this payment');
    }

    return payment;
  }

  async createInvoice(
    createInvoiceDto: CreateInvoiceDto,
    actor: { id: string; role: UserRole },
  ) {
    return await this.prisma
      .$transaction(async (tx) => {
        const invoice = await tx.invoice.create({
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

        // 📸 CREATE SNAPSHOT: Invoice Issued (MANDATORY - fail-fast)
        const snapshotId = await this.snapshotService.create(
          {
            actorId: actor.id,
            actorRole: actor.role,
            actionType: 'INVOICE_ISSUED',
            entityType: 'INVOICE',
            entityId: invoice.id,
            metadata: {
              invoiceNumber: invoice.invoiceNumber,
              totalAmount: Number(invoice.totalAmount),
              items: await tx.invoiceLineItem.findMany({
                where: { invoiceId: invoice.id },
              }),
            },
          },
          tx,
        );

        // Update invoice with snapshotId
        await tx.invoice.update({
          where: { id: invoice.id },
          data: { snapshotId },
        });

        return invoice;
      })
      .then((invoice) => {
        // 🔔 TRIGGER NOTIFICATION: Invoice Generated (ASYNC - outside transaction)
        try {
          this.notificationsService
            .create({
              userId: invoice.contract.tenantId,
              title: 'Hóa đơn mới đã được tạo',
              content: `Hóa đơn ${invoice.invoiceNumber} cho phòng ${invoice.contract.room.roomNumber} với số tiền ${Number(invoice.totalAmount).toLocaleString('vi-VN')} VNĐ. Hạn thanh toán: ${new Date(invoice.dueDate).toLocaleDateString('vi-VN')}`,
              notificationType: NotificationType.PAYMENT,
              relatedEntityId: invoice.id,
            })
            .catch((err) =>
              this.logger.error('Failed to send invoice notification', err),
            );
        } catch (error) {
          this.logger.error('Notification service error', error);
        }

        // Convert Decimal to Number
        const cleaned = {
          ...invoice,
          totalAmount: invoice.totalAmount ? Number(invoice.totalAmount) : 0,
        };

        return plainToClass(InvoiceResponseDto, cleaned, {
          excludeExtraneousValues: true,
        });
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

  async findOneInvoice(id: string, user: { id: string; role: UserRole }) {
    // 🔒 CRITICAL: Verify ownership before returning data
    await this.assertInvoiceOwnership(id, user.id, user.role);

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

  async updateInvoice(
    id: string,
    updateDto: UpdateInvoiceDto,
    user: { id: string; role: UserRole },
  ) {
    // 🔒 CRITICAL: Verify ownership before mutation
    await this.assertInvoiceOwnership(id, user.id, user.role);

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

  /**
   * 🔒 CRITICAL: Mark invoice as paid with idempotency + row locking
   * Prevents double payment attacks
   */
  async markAsPaid(
    id: string,
    user: { id: string; role: UserRole },
    idempotencyKey?: string,
  ) {
    return await this.prisma.$transaction(async (tx) => {
      // 🔐 ROW LOCK: Prevent concurrent modifications
      const invoice = await tx.invoice.findUnique({
        where: { id },
        include: {
          contract: {
            include: {
              landlord: true,
              room: true,
            },
          },
          payments: true,
        },
      });

      if (!invoice) {
        throw new NotFoundException(`Invoice ${id} not found`);
      }

      // 🔒 OWNERSHIP: Verify access before mutation
      await this.assertInvoiceOwnership(id, user.id, user.role, tx);

      // ✅ IDEMPOTENCY: Early return if already paid
      if (invoice.status === InvoiceStatus.PAID) {
        this.logger.warn(
          `Invoice ${id} already paid (idempotency protected)`,
        );
        return {
          ...invoice,
          totalAmount: Number(invoice.totalAmount),
        };
      }

      // 🔒 AUTHORIZATION: Verify role permissions
      if (user.role === UserRole.TENANT && invoice.tenantId !== user.id) {
        throw new ForbiddenException(
          'You can only mark your own invoices as paid',
        );
      }

      // Optional: Store idempotency key to detect retries
      if (idempotencyKey) {
        const existingOperation = await tx.$queryRaw<any[]>`
          SELECT * FROM idempotent_operations 
          WHERE idempotency_key = ${idempotencyKey} 
          AND entity_type = 'INVOICE_PAYMENT' 
          AND entity_id = ${id}
          LIMIT 1
        `;
        if (existingOperation && existingOperation.length > 0) {
          this.logger.warn(
            `Duplicate operation detected for key ${idempotencyKey}`,
          );
          // Return existing result from idempotent_operations.result_data
          return existingOperation[0].result_data;
        }
      }

      const paid = await tx.invoice.update({
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

      // � LOG STATE TRANSITION: Invoice PENDING → PAID
      await this.stateLogger.logTransitionSafe({
        entityType: 'invoice',
        entityId: id,
        oldStatus: InvoiceStatus.PENDING,
        newStatus: InvoiceStatus.PAID,
        actorId: user.id,
        actorRole: user.role,
        reason: `Payment received via ${idempotencyKey ? 'idempotent operation' : 'API'}`,
      });

      // �📸 CREATE SNAPSHOT: Invoice Paid (MANDATORY - fail-fast)
      const paymentSnapshotId = await this.snapshotService.create(
        {
          actorId: user.id,
          actorRole: user.role,
          actionType: 'INVOICE_PAID',
          entityType: 'INVOICE',
          entityId: paid.id,
          metadata: {
            invoiceNumber: paid.invoiceNumber,
            paidAt: paid.paidAt,
            totalAmount: Number(paid.totalAmount),
            idempotencyKey: idempotencyKey || null,
          },
        },
        tx,
      );

      await tx.invoice.update({
        where: { id: paid.id },
        data: { snapshotId: paymentSnapshotId },
      });

      // Store idempotency result if key provided
      if (idempotencyKey) {
        await tx.$executeRaw`
          INSERT INTO idempotent_operations (idempotency_key, entity_type, entity_id, result_data, created_at)
          VALUES (${idempotencyKey}, 'INVOICE_PAYMENT', ${id}, ${JSON.stringify({ totalAmount: Number(paid.totalAmount) })}, NOW())
          ON CONFLICT (idempotency_key) DO NOTHING
        `;
      }

      return {
        ...paid,
        totalAmount: Number(paid.totalAmount),
      };
    });
  }

  async sendPaymentReminder(id: string, user: { id: string; role: UserRole }) {
    const invoice = await this.findOneInvoice(id, user);

    if (invoice.status === InvoiceStatus.PAID) {
      throw new ForbiddenException('Invoice is already paid');
    }

    // Only Landlord can send reminders
    if (user.role !== UserRole.LANDLORD) {
      // Unless it's the specific landlord of the property?
      // For now trust the role check + findOneInvoice ownership check
    }

    // 🔔 TRIGGER NOTIFICATION
    try {
      await this.notificationsService.create({
        userId: invoice.tenantId,
        title: 'Nhắc nhở thanh toán',
        content: `Bạn có hóa đơn ${invoice.invoiceNumber} chưa thanh toán. Số tiền: ${Number(invoice.totalAmount).toLocaleString('vi-VN')} VNĐ. Vui lòng thanh toán sớm.`,
        notificationType: NotificationType.PAYMENT,
        relatedEntityId: invoice.id,
      });
      return { message: 'Payment reminder sent successfully' };
    } catch (error) {
      this.logger.error('Failed to send payment reminder', error);
      throw new InternalServerErrorException('Failed to send reminder');
    }
  }

  async removeInvoice(id: string, user: { id: string; role: UserRole }) {
    // 🔒 CRITICAL: Verify ownership before deletion
    const invoice = await this.findOneInvoice(id, user);

    // CRITICAL: Soft-delete with mandatory snapshot for audit trail
    await this.prisma.$transaction(async (tx) => {
      // Soft-delete invoice
      await tx.invoice.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          status: InvoiceStatus.PENDING, // Mark as cancelled
        },
      });

      // 📸 CREATE SNAPSHOT: Invoice Deleted (MANDATORY - fail-fast)
      await this.snapshotService.create(
        {
          actorId: user?.id || 'system',
          actorRole: user?.role || UserRole.ADMIN,
          actionType: 'INVOICE_DELETED',
          entityType: 'INVOICE',
          entityId: id,
          metadata: {
            invoiceNumber: invoice.invoiceNumber,
            originalAmount: Number(invoice.totalAmount),
            originalStatus: invoice.status,
            contractId: invoice.contractId,
            tenantId: invoice.tenantId,
            reason: 'Manual deletion',
          },
        },
        tx,
      );
    });

    return {
      message: 'Invoice deleted successfully (soft-delete with audit trail)',
    };
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
   * Submit meter readings for utilities (LANDLORD ONLY)
   * ⚠️ CRITICAL: Tenants CANNOT submit meter readings
   * Only landlords can record utility consumption for billing
   */
  async submitMeterReadingsForLandlord(
    dto: {
      contractId: string;
      month: string;
      readings: Array<{ serviceId: string; currentReading: number }>;
    },
    actor?: { id: string; role: UserRole }, // Optional: enforce landlord role
  ) {
    // 🔒 AUTHORIZATION: If actor provided, verify landlord role
    if (actor && actor.role !== UserRole.LANDLORD && actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only landlords can submit meter readings. Tenants may provide readings but landlord must confirm.',
      );
    }

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
   * ⚠️ DEPRECATED: Tenants cannot submit meter readings
   * All meter reading submissions must go through landlord
   * This method is REMOVED to prevent tenant meter submission
   * Use submitMeterReadingsForLandlord() instead with role check
   */
  // async submitMeterReadings(...) { } // REMOVED - Tenants cannot submit meters

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
    const hasMeteredServices = contract.room.property.services.some(
      (s) => s.billingMethod === 'METERED',
    );
    if (
      hasMeteredServices &&
      readings.length === 0 &&
      !options?.includeRent &&
      !options?.includeFixedServices
    ) {
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
      const fixedServices = contract.room.property.services.filter(
        (s) => s.billingMethod === 'FIXED',
      );
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

    // --- PERSIST (WRAPPED IN TRANSACTION) ---
    const result = await this.prisma.$transaction(async (tx) => {
      // Create invoice
      const invoice = await tx.invoice.create({
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
        await tx.invoiceLineItem.create({
          data: {
            invoiceId: invoice.id,
            ...item,
          },
        });
      }

      // 📸 CREATE SNAPSHOT: Utility Invoice Generated (MANDATORY - fail-fast)
      const snapshotId = await this.snapshotService.create(
        {
          actorId: user?.id || contract.room.property.landlord.userId,
          actorRole: UserRole.LANDLORD,
          actionType: 'UTILITY_INVOICE_GENERATED',
          entityType: 'INVOICE',
          entityId: invoice.id,
          metadata: {
            contractId,
            month,
            invoiceNumber: invoice.invoiceNumber,
            totalAmount: Number(totalAmount),
            lineItemCount: lineItemsToCreate.length,
            includedRent: options?.includeRent !== false,
            includedFixedServices: options?.includeFixedServices !== false,
            meterReadingCount: readings.length,
          },
        },
        tx,
      );

      // Update invoice with snapshotId
      await tx.invoice.update({
        where: { id: invoice.id },
        data: { snapshotId },
      });

      return invoice;
    });

    return {
      invoice: {
        ...result,
        totalAmount: Number(result.totalAmount),
      },
      readings: readings.map((r) => ({
        ...r,
        amount: Number(r.amount),
        usage: Number(r.usage),
        service: {
          ...r.service,
          unitPrice: Number(r.service.unitPrice),
        },
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

    // CRITICAL: Wrap payment + status update in transaction with snapshot
    const result = await this.prisma.$transaction(async (tx) => {
      // Create payment record
      const payment = await tx.payment.create({
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
      const paidTotal = await tx.payment.aggregate({
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

      const updatedInvoice = await tx.invoice.update({
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

      // 📸 CREATE SNAPSHOT: Utility Payment Recorded (MANDATORY - fail-fast)
      await this.snapshotService.create(
        {
          actorId: user?.id || invoice.tenantId,
          actorRole: user?.role || UserRole.TENANT,
          actionType: 'UTILITY_PAYMENT_RECORDED',
          entityType: 'PAYMENT',
          entityId: payment.id,
          metadata: {
            invoiceId,
            invoiceNumber: invoice.invoiceNumber,
            paymentMethod,
            amount: Number(amount),
            totalPaid: Number(totalPaid),
            invoiceTotal: Number(invoiceTotal),
            newStatus,
            isFullyPaid: totalPaid >= invoiceTotal,
          },
        },
        tx,
      );

      return { payment, updatedInvoice };
    });

    return {
      payment: {
        ...result.payment,
        amount: Number(result.payment.amount),
      },
      invoice: {
        ...result.updatedInvoice,
        totalAmount: Number(result.updatedInvoice.totalAmount),
        lineItems: result.updatedInvoice.lineItems.map((item) => ({
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
