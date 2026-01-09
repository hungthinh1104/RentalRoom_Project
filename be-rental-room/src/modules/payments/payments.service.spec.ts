import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { faker } from '@faker-js/faker';
import { PaymentStatus, PaymentMethod } from './entities';

import { PaymentService } from './payment.service';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prismaService: PrismaService;
  let paymentFacade: PaymentService;

  const mockPayment = {
    id: faker.string.uuid(),
    invoiceId: faker.string.uuid(),
    tenantId: faker.string.uuid(),
    amount: 5000000,
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    status: PaymentStatus.PENDING,
    transactionId: 'TXN-2024-001',
    paymentDate: new Date('2024-01-15'),
    paidAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    payment: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    invoice: {
      update: jest.fn(),
    },
  };

  const mockPaymentFacade = {
    verifyPayment: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: PaymentService,
          useValue: mockPaymentFacade,
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    prismaService = module.get<PrismaService>(PrismaService);
    paymentFacade = module.get<PaymentService>(PaymentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new payment', async () => {
      const createDto = {
        invoiceId: mockPayment.invoiceId,
        tenantId: mockPayment.tenantId,
        amount: mockPayment.amount,
        paymentMethod: mockPayment.paymentMethod,
        transactionId: mockPayment.transactionId,
        paymentDate: '2024-01-15',
      };

      mockPrismaService.payment.create.mockResolvedValue(mockPayment);

      const result = await service.create(createDto);

      expect(prismaService.payment.create).toHaveBeenCalledWith({
        data: createDto,
      });
      expect(result).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should return paginated payments', async () => {
      const payments = [
        mockPayment,
        { ...mockPayment, id: faker.string.uuid() },
      ];

      mockPrismaService.payment.findMany.mockResolvedValue(payments);
      mockPrismaService.payment.count.mockResolvedValue(2);

      const result = await service.findAll({
        page: 1,
        limit: 10,
        skip: 0,
      });

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
    });

    it('should filter payments by status', async () => {
      mockPrismaService.payment.findMany.mockResolvedValue([mockPayment]);
      mockPrismaService.payment.count.mockResolvedValue(1);

      await service.findAll({
        page: 1,
        limit: 10,
        status: PaymentStatus.PENDING,
        skip: 0,
      });

      expect(prismaService.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: PaymentStatus.PENDING,
          }),
        }),
      );
    });

    it('should filter payments by payment method', async () => {
      mockPrismaService.payment.findMany.mockResolvedValue([mockPayment]);
      mockPrismaService.payment.count.mockResolvedValue(1);

      await service.findAll({
        page: 1,
        limit: 10,
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        skip: 0,
      });

      expect(prismaService.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            paymentMethod: PaymentMethod.BANK_TRANSFER,
          }),
        }),
      );
    });

    it('should filter payments by invoiceId', async () => {
      mockPrismaService.payment.findMany.mockResolvedValue([mockPayment]);
      mockPrismaService.payment.count.mockResolvedValue(1);

      await service.findAll({
        page: 1,
        limit: 10,
        invoiceId: mockPayment.invoiceId,
        skip: 0,
      });

      expect(prismaService.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            invoiceId: mockPayment.invoiceId,
          }),
        }),
      );
    });

    it('should search payments by transaction ID', async () => {
      mockPrismaService.payment.findMany.mockResolvedValue([mockPayment]);
      mockPrismaService.payment.count.mockResolvedValue(1);

      await service.findAll({
        page: 1,
        limit: 10,
        search: 'TXN-2024',
        skip: 0,
      });

      expect(prismaService.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            transactionId: expect.objectContaining({
              contains: 'TXN-2024',
              mode: 'insensitive',
            }),
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a payment by id', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValue(mockPayment);

      const result = await service.findOne(mockPayment.id);

      expect(result).toBeDefined();
      expect(prismaService.payment.findUnique).toHaveBeenCalledWith({
        where: { id: mockPayment.id },
      });
    });

    it('should throw NotFoundException if payment not found', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a payment', async () => {
      const updateDto = { amount: 6000000 };
      const updatedPayment = { ...mockPayment, amount: 6000000 };

      mockPrismaService.payment.findUnique.mockResolvedValue(mockPayment);
      mockPrismaService.payment.update.mockResolvedValue(updatedPayment);

      const result = await service.update(mockPayment.id, updateDto);

      expect(prismaService.payment.update).toHaveBeenCalledWith({
        where: { id: mockPayment.id },
        data: updateDto,
      });
    });
  });

  describe('confirmPayment', () => {
    it('should confirm a payment', async () => {
      const completedPayment = {
        ...mockPayment,
        status: PaymentStatus.COMPLETED,
        paidAt: new Date(),
      };

      mockPrismaService.payment.findUnique.mockResolvedValue(mockPayment);
      mockPrismaService.payment.update.mockResolvedValue(completedPayment);

      const result = await service.confirmPayment(mockPayment.id);

      expect(prismaService.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockPayment.id },
          data: expect.objectContaining({
            status: PaymentStatus.COMPLETED,
            paidAt: expect.any(Date),
          }),
        }),
      );
    });
  });

  describe('checkPaymentStatus', () => {
    it('should return completed if already paid', async () => {
      const paidPayment = { ...mockPayment, status: PaymentStatus.COMPLETED };
      mockPrismaService.payment.findUnique.mockResolvedValue(paidPayment);

      const result = await service.checkPaymentStatus(mockPayment.id);
      expect(result.success).toBe(true);
      expect((result as any).error).toBe('Payment already completed');
    });

    it('should verify and update status if successful', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValue({
        ...mockPayment,
        invoice: { contract: { id: 'contract-123' } },
      });
      mockPaymentFacade.verifyPayment.mockResolvedValue({
        success: true,
        transaction: { transactionId: 'TX123', content: 'Paid' },
      });

      const result = await service.checkPaymentStatus(mockPayment.id);

      expect(result.success).toBe(true);
      expect(prismaService.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockPayment.id },
          data: expect.objectContaining({ status: PaymentStatus.COMPLETED }),
        }),
      );
      expect(prismaService.invoice.update).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a payment', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValue(mockPayment);
      mockPrismaService.payment.delete.mockResolvedValue(mockPayment);

      const result = await service.remove(mockPayment.id);

      expect(prismaService.payment.delete).toHaveBeenCalledWith({
        where: { id: mockPayment.id },
      });
      expect(result).toEqual({ message: 'Payment deleted successfully' });
    });
  });
});
