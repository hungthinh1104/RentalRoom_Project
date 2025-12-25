import { Test, TestingModule } from '@nestjs/testing';
import { BillingService } from './billing.service';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { faker } from '@faker-js/faker';
import { InvoiceStatus, ItemType } from './entities';

describe('BillingService', () => {
  let service: BillingService;
  let prismaService: PrismaService;

  const mockInvoice = {
    id: faker.string.uuid(),
    contractId: faker.string.uuid(),
    tenantId: faker.string.uuid(),
    invoiceNumber: 'INV-2024-001',
    issueDate: new Date('2024-01-01'),
    dueDate: new Date('2024-01-31'),
    totalAmount: 7000000,
    status: InvoiceStatus.PENDING,
    paidAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockLineItem = {
    id: faker.string.uuid(),
    invoiceId: mockInvoice.id,
    serviceId: faker.string.uuid(),
    itemType: ItemType.RENT,
    description: 'Monthly rent',
    quantity: 1,
    unitPrice: 5000000,
    amount: 5000000,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    invoice: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    invoiceLineItem: {
      create: jest.fn(),
      aggregate: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createInvoice', () => {
    it('should create a new invoice', async () => {
      const createDto = {
        contractId: mockInvoice.contractId,
        tenantId: mockInvoice.tenantId,
        invoiceNumber: mockInvoice.invoiceNumber,
        issueDate: '2024-01-01',
        dueDate: '2024-01-31',
        totalAmount: mockInvoice.totalAmount,
      };

      mockPrismaService.invoice.create.mockResolvedValue(mockInvoice);

      const result = await service.createInvoice(createDto);

      expect(prismaService.invoice.create).toHaveBeenCalledWith({
        data: createDto,
      });
      expect(result).toBeDefined();
    });
  });

  describe('addLineItem', () => {
    it('should add a line item to invoice and update total', async () => {
      const createLineItemDto = {
        invoiceId: mockInvoice.id,
        itemType: ItemType.RENT,
        quantity: 1,
        unitPrice: 5000000,
        amount: 5000000,
      };

      mockPrismaService.invoiceLineItem.create.mockResolvedValue(mockLineItem);
      mockPrismaService.invoiceLineItem.aggregate.mockResolvedValue({
        _sum: { amount: 5000000 },
      });
      mockPrismaService.invoice.update.mockResolvedValue(mockInvoice);

      const result = await service.addLineItem(
        mockInvoice.id,
        createLineItemDto,
      );

      expect(prismaService.invoiceLineItem.create).toHaveBeenCalledWith({
        data: {
          ...createLineItemDto,
          invoiceId: mockInvoice.id,
        },
      });
      expect(prismaService.invoiceLineItem.aggregate).toHaveBeenCalledWith({
        where: { invoiceId: mockInvoice.id },
        _sum: { amount: true },
      });
      expect(prismaService.invoice.update).toHaveBeenCalledWith({
        where: { id: mockInvoice.id },
        data: { totalAmount: 5000000 },
      });
      expect(result).toEqual(mockLineItem);
    });

    it('should handle zero total when no line items exist', async () => {
      const createLineItemDto = {
        invoiceId: mockInvoice.id,
        itemType: ItemType.RENT,
        quantity: 1,
        unitPrice: 5000000,
        amount: 5000000,
      };

      mockPrismaService.invoiceLineItem.create.mockResolvedValue(mockLineItem);
      mockPrismaService.invoiceLineItem.aggregate.mockResolvedValue({
        _sum: { amount: null },
      });
      mockPrismaService.invoice.update.mockResolvedValue({
        ...mockInvoice,
        totalAmount: 0,
      });

      await service.addLineItem(mockInvoice.id, createLineItemDto);

      expect(prismaService.invoice.update).toHaveBeenCalledWith({
        where: { id: mockInvoice.id },
        data: { totalAmount: 0 },
      });
    });
  });

  describe('findAllInvoices', () => {
    it('should return paginated invoices', async () => {
      const invoices = [
        { ...mockInvoice, _count: { lineItems: 2 } },
        { ...mockInvoice, id: faker.string.uuid(), _count: { lineItems: 1 } },
      ];

      mockPrismaService.invoice.findMany.mockResolvedValue(invoices);
      mockPrismaService.invoice.count.mockResolvedValue(2);

      const result = await service.findAllInvoices({
        page: 1,
        limit: 10,
        skip: 0,
      });

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
    });

    it('should filter invoices by status', async () => {
      mockPrismaService.invoice.findMany.mockResolvedValue([
        { ...mockInvoice, _count: { lineItems: 0 } },
      ]);
      mockPrismaService.invoice.count.mockResolvedValue(1);

      await service.findAllInvoices({
        page: 1,
        limit: 10,
        status: InvoiceStatus.PENDING,
        skip: 0,
      });

      expect(prismaService.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: InvoiceStatus.PENDING,
          }),
        }),
      );
    });

    it('should filter invoices by contractId', async () => {
      mockPrismaService.invoice.findMany.mockResolvedValue([
        { ...mockInvoice, _count: { lineItems: 0 } },
      ]);
      mockPrismaService.invoice.count.mockResolvedValue(1);

      await service.findAllInvoices({
        page: 1,
        limit: 10,
        contractId: mockInvoice.contractId,
        skip: 0,
      });

      expect(prismaService.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            contractId: mockInvoice.contractId,
          }),
        }),
      );
    });

    it('should search invoices by invoice number', async () => {
      mockPrismaService.invoice.findMany.mockResolvedValue([
        { ...mockInvoice, _count: { lineItems: 0 } },
      ]);
      mockPrismaService.invoice.count.mockResolvedValue(1);

      await service.findAllInvoices({
        page: 1,
        limit: 10,
        search: 'INV-2024',
        skip: 0,
      });

      expect(prismaService.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            invoiceNumber: expect.objectContaining({
              contains: 'INV-2024',
              mode: 'insensitive',
            }),
          }),
        }),
      );
    });
  });

  describe('findOneInvoice', () => {
    it('should return an invoice by id with line items', async () => {
      const invoiceWithItems = {
        ...mockInvoice,
        lineItems: [mockLineItem],
        _count: { lineItems: 1 },
      };

      mockPrismaService.invoice.findUnique.mockResolvedValue(invoiceWithItems);

      const result = await service.findOneInvoice(mockInvoice.id);

      expect(result).toBeDefined();
      expect(prismaService.invoice.findUnique).toHaveBeenCalledWith({
        where: { id: mockInvoice.id },
        include: {
          lineItems: true,
          _count: {
            select: { lineItems: true },
          },
        },
      });
    });

    it('should throw NotFoundException if invoice not found', async () => {
      mockPrismaService.invoice.findUnique.mockResolvedValue(null);

      await expect(service.findOneInvoice('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateInvoice', () => {
    it('should update an invoice', async () => {
      const updateDto = { totalAmount: 8000000 };
      const updatedInvoice = { ...mockInvoice, totalAmount: 8000000 };

      mockPrismaService.invoice.findUnique.mockResolvedValue({
        ...mockInvoice,
        lineItems: [],
        _count: { lineItems: 0 },
      });
      mockPrismaService.invoice.update.mockResolvedValue(updatedInvoice);

      const result = await service.updateInvoice(mockInvoice.id, updateDto);

      expect(prismaService.invoice.update).toHaveBeenCalledWith({
        where: { id: mockInvoice.id },
        data: updateDto,
      });
    });
  });

  describe('markAsPaid', () => {
    it('should mark an invoice as paid', async () => {
      const paidInvoice = {
        ...mockInvoice,
        status: InvoiceStatus.PAID,
        paidAt: new Date(),
      };

      mockPrismaService.invoice.findUnique.mockResolvedValue({
        ...mockInvoice,
        lineItems: [],
        _count: { lineItems: 0 },
      });
      mockPrismaService.invoice.update.mockResolvedValue(paidInvoice);

      const result = await service.markAsPaid(mockInvoice.id);

      expect(prismaService.invoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockInvoice.id },
          data: expect.objectContaining({
            status: InvoiceStatus.PAID,
            paidAt: expect.any(Date),
          }),
        }),
      );
    });
  });

  describe('removeInvoice', () => {
    it('should delete an invoice', async () => {
      mockPrismaService.invoice.findUnique.mockResolvedValue({
        ...mockInvoice,
        lineItems: [],
        _count: { lineItems: 0 },
      });
      mockPrismaService.invoice.delete.mockResolvedValue(mockInvoice);

      const result = await service.removeInvoice(mockInvoice.id);

      expect(prismaService.invoice.delete).toHaveBeenCalledWith({
        where: { id: mockInvoice.id },
      });
      expect(result).toEqual({ message: 'Invoice deleted successfully' });
    });
  });
});
