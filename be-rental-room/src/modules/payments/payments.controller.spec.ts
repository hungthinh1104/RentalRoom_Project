import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, UpdatePaymentDto, FilterPaymentsDto } from './dto';
import { PaymentMethod, PaymentStatus } from './entities';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let service: PaymentsService;

  const mockPaymentsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    confirmPayment: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        {
          provide: PaymentsService,
          useValue: mockPaymentsService,
        },
      ],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
    service = module.get<PaymentsService>(PaymentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new payment', async () => {
      const createDto: CreatePaymentDto = {
        invoiceId: 'invoice-123',
        tenantId: 'tenant-123',
        amount: 5000000,
        paymentDate: '2025-01-01',
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        status: PaymentStatus.PENDING,
      };

      const mockCreatedPayment = {
        id: 'payment-123',
        ...createDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPaymentsService.create.mockResolvedValue(mockCreatedPayment);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockCreatedPayment);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return all payments with filter', async () => {
      const filterDto: FilterPaymentsDto = {
        skip: 0,
        status: PaymentStatus.COMPLETED,
      };

      const mockPayments = [
        { id: 'payment-1', amount: 5000000, status: PaymentStatus.COMPLETED },
        { id: 'payment-2', amount: 6000000, status: PaymentStatus.COMPLETED },
      ];

      mockPaymentsService.findAll.mockResolvedValue(mockPayments);

      const result = await controller.findAll(filterDto);

      expect(result).toEqual(mockPayments);
      expect(service.findAll).toHaveBeenCalledWith(filterDto, undefined);
    });

    it('should return empty array when no payments match', async () => {
      const filterDto: FilterPaymentsDto = { skip: 0 };

      mockPaymentsService.findAll.mockResolvedValue([]);

      const result = await controller.findAll(filterDto);

      expect(result).toEqual([]);
      expect(service.findAll).toHaveBeenCalledWith(filterDto, undefined);
    });
  });

  describe('findOne', () => {
    it('should return a single payment by id', async () => {
      const paymentId = 'payment-123';
      const mockPayment = {
        id: paymentId,
        contractId: 'contract-123',
        amount: 5000000,
        status: 'completed',
      };

      mockPaymentsService.findOne.mockResolvedValue(mockPayment);

      const result = await controller.findOne(paymentId);

      expect(result).toEqual(mockPayment);
      expect(service.findOne).toHaveBeenCalledWith(paymentId);
    });
  });

  describe('update', () => {
    it('should update a payment', async () => {
      const paymentId = 'payment-123';
      const updateDto: UpdatePaymentDto = {
        status: PaymentStatus.COMPLETED,
      };

      const mockUpdatedPayment = {
        id: paymentId,
        invoiceId: 'invoice-123',
        tenantId: 'tenant-123',
        amount: 5000000,
        ...updateDto,
      };

      mockPaymentsService.update.mockResolvedValue(mockUpdatedPayment);

      const result = await controller.update(paymentId, updateDto);

      expect(result).toEqual(mockUpdatedPayment);
      expect(service.update).toHaveBeenCalledWith(paymentId, updateDto);
    });
  });

  describe('confirmPayment', () => {
    it('should confirm a payment', async () => {
      const paymentId = 'payment-123';

      const mockConfirmedPayment = {
        id: paymentId,
        status: 'completed',
        confirmedAt: new Date(),
      };

      mockPaymentsService.confirmPayment.mockResolvedValue(
        mockConfirmedPayment,
      );

      const result = await controller.confirmPayment(paymentId);

      expect(result).toEqual(mockConfirmedPayment);
      expect(service.confirmPayment).toHaveBeenCalledWith(paymentId);
    });
  });

  describe('remove', () => {
    it('should remove a payment', async () => {
      const paymentId = 'payment-123';

      mockPaymentsService.remove.mockResolvedValue({ deleted: true });

      const result = await controller.remove(paymentId);

      expect(result).toEqual({ deleted: true });
      expect(service.remove).toHaveBeenCalledWith(paymentId);
    });
  });
});
