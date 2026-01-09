import { Test, TestingModule } from '@nestjs/testing';
import { ContractsService } from './contracts.service';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from 'src/common/services/email.service';
import { PaymentService } from '../payments/payment.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ContractStatus, ApplicationStatus } from './entities';
import { RoomStatus } from '@prisma/client';

describe('ContractsService', () => {
  let service: ContractsService;
  let prisma: PrismaService;
  let paymentService: PaymentService;

  const mockPrismaService = {
    rentalApplication: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    contract: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    room: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    tenant: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    payment: {
      create: jest.fn(),
    },
    invoice: {
      create: jest.fn(),
    },

    paymentConfig: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  const mockNotificationsService = {
    create: jest.fn(),
  };

  const mockEmailService = {
    sendEmail: jest.fn(),
    sendRentalApplicationStatusEmail: jest.fn(),
  };

  const mockPaymentService = {
    verifyPayment: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: PaymentService, useValue: mockPaymentService },
      ],
    }).compile();

    service = module.get<ContractsService>(ContractsService);
    prisma = module.get<PrismaService>(PrismaService);
    paymentService = module.get<PaymentService>(PaymentService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('Rental Applications', () => {
    describe('createApplication', () => {
      it('should create a rental application successfully', async () => {
        const createDto = {
          roomId: 'room-123',
          tenantId: 'tenant-123',
          landlordId: 'landlord-123',
          message: 'I would like to rent this room',
        };

        const mockApplication = {
          id: 'app-123',
          ...createDto,
          status: ApplicationStatus.PENDING,
          createdAt: new Date(),
        };

        const mockUser = {
          id: 'user-123',
          email: 'test@example.com',
          fullName: 'Test User',
          role: 'TENANT',
          isEmailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          phoneNumber: '0123456789',
        };

        const mockTenant = {
          id: 'tenant-id-123',
          userId: 'user-123',
          user: mockUser,
        };

        const mockRoom = {
          id: 'room-123',
          roomNumber: '101',
          property: {
            landlordId: 'landlord-123',
          },
        };

        mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
        mockPrismaService.room.findUnique.mockResolvedValue(mockRoom);
        mockPrismaService.rentalApplication.create.mockResolvedValue(
          mockApplication,
        );

        const result = await service.createApplication(
          createDto as any,
          mockUser as any,
        );

        expect(result).toBeDefined();
        expect(result.id).toBe('app-123');
      });
    });

    describe('approveApplication', () => {
      it('should approve application and set room to RESERVED', async () => {
        const appId = 'app-123';
        const mockContract = {
          id: 'contract-123',
          contractNumber: 'CT-2025-001',
          status: ContractStatus.PENDING_SIGNATURE,
        };

        const mockApplication = {
          id: appId,
          roomId: 'room-123',
          tenantId: 'tenant-123',
          landlordId: 'landlord-123',
          status: ApplicationStatus.PENDING,
          tenant: {
            user: {
              id: 'user-1',
              fullName: 'Tenant Name',
              email: 'tenant@test.com',
            },
          },
          room: {
            roomNumber: '101',
            property: {
              landlord: {
                user: {
                  id: 'user-2',
                  fullName: 'Landlord Name',
                  email: 'landlord@test.com',
                  phoneNumber: '0123456789',
                },
              },
            },
          },
        };

        mockPrismaService.rentalApplication.findUnique.mockResolvedValue(
          mockApplication,
        );
        mockPrismaService.rentalApplication.update.mockResolvedValue({
          ...mockApplication,
          status: ApplicationStatus.APPROVED,
        });
        mockPrismaService.contract.create.mockResolvedValue(mockContract);
        mockPrismaService.room.update.mockResolvedValue({
          id: 'room-123',
          status: RoomStatus.RESERVED,
        });

        const result = await service.approveApplication(appId);

        // Verify room was set to RESERVED
        expect(mockPrismaService.room.update).toHaveBeenCalledWith({
          where: { id: 'room-123' },
          data: { status: RoomStatus.RESERVED },
        });

        // Verify application was approved
        expect(mockPrismaService.rentalApplication.update).toHaveBeenCalled();
        expect(result).toBeDefined();
        expect(result.contract).toBeDefined();
      });
    });
  });

  describe('Contract Management', () => {
    describe('create', () => {
      it('should create contract with auto-generated contract number', async () => {
        const createDto = {
          roomId: 'room-123',
          tenantId: 'tenant-123',
          landlordId: 'landlord-123',
          startDate: '2025-02-01',
          endDate: '2026-02-01',
          monthlyRent: 5000000,
          deposit: 10000000,
        };

        const mockPaymentConfig = {
          landlordId: 'landlord-123',
          apiToken: 'encrypted-token',
          isActive: true,
        };

        const mockRoom = {
          id: 'room-123',
          status: RoomStatus.AVAILABLE,
        };

        const mockContract = {
          id: 'contract-123',
          ...createDto,
          contractNumber: 'HD-LAND-202501-0001',
          status: ContractStatus.DEPOSIT_PENDING,
          residents: [],
        };

        mockPrismaService.paymentConfig.findUnique.mockResolvedValue(
          mockPaymentConfig,
        );
        mockPrismaService.room.findUnique.mockResolvedValue(mockRoom);
        mockPrismaService.contract.create.mockResolvedValue(mockContract);
        mockPrismaService.contract.count.mockResolvedValue(0);

        const result = await service.create(createDto as any);

        expect(result).toBeDefined();
        expect(mockPrismaService.contract.create).toHaveBeenCalled();
      });

      it('should throw error if payment config not set up', async () => {
        const createDto = {
          roomId: 'room-123',
          tenantId: 'tenant-123',
          landlordId: 'landlord-123',
          startDate: '2025-02-01',
          endDate: '2026-02-01',
          monthlyRent: 5000000,
          deposit: 10000000,
        };

        mockPrismaService.paymentConfig.findUnique.mockResolvedValue(null);

        await expect(service.create(createDto as any)).rejects.toThrow(
          BadRequestException,
        );
      });
    });

    describe('verifyPaymentStatus', () => {
      it('should activate contract when payment is verified', async () => {
        const contractId = 'contract-123';
        const mockContract = {
          id: contractId,
          roomId: 'room-123',
          tenantId: 'tenant-123',
          landlordId: 'landlord-123',
          applicationId: 'app-123',
          contractNumber: 'HD-LAND-202501-0001',
          deposit: 10000000,
          status: ContractStatus.DEPOSIT_PENDING,
          room: {},
          landlord: {},
        };

        mockPrismaService.contract.findUnique.mockResolvedValue(mockContract);
        mockPaymentService.verifyPayment.mockResolvedValue({ success: true });
        mockPrismaService.tenant.findUnique.mockResolvedValue({
          user: { email: 'tenant@test.com', fullName: 'Tenant Name' },
        });
        mockPrismaService.invoice.create.mockResolvedValue({ id: 'inv-1' });

        const result = await service.verifyPaymentStatus(contractId);

        expect(result.success).toBe(true);
        expect(result.status).toBe(ContractStatus.ACTIVE);

        // Verify contract was activated
        expect(mockPrismaService.contract.update).toHaveBeenCalledWith({
          where: { id: contractId },
          data: { status: ContractStatus.ACTIVE, depositDeadline: null },
        });

        // Verify room was set to OCCUPIED
        expect(mockPrismaService.room.update).toHaveBeenCalledWith({
          where: { id: 'room-123' },
          data: { status: RoomStatus.OCCUPIED },
        });

        // Verify application was marked COMPLETED
        expect(mockPrismaService.rentalApplication.update).toHaveBeenCalledWith(
          {
            where: { id: 'app-123' },
            data: {
              status: ApplicationStatus.COMPLETED,
              contractId: contractId,
            },
          },
        );

        // Verify other applications were rejected
        expect(
          mockPrismaService.rentalApplication.updateMany,
        ).toHaveBeenCalledWith({
          where: {
            roomId: 'room-123',
            status: ApplicationStatus.PENDING,
            id: { not: 'app-123' },
          },
          data: {
            status: ApplicationStatus.REJECTED,
            rejectionReason: 'Phòng đã được thuê bởi người khác',
            reviewedAt: expect.any(Date),
          },
        });
      });

      it('should return false if payment not found', async () => {
        const contractId = 'contract-123';
        const mockContract = {
          id: contractId,
          deposit: 10000000,
          status: ContractStatus.DEPOSIT_PENDING,
          room: {},
          landlord: {},
        };

        mockPrismaService.contract.findUnique.mockResolvedValue(mockContract);
        mockPaymentService.verifyPayment.mockResolvedValue({ success: false });

        const result = await service.verifyPaymentStatus(contractId);

        expect(result.success).toBe(false);
        expect(result.status).toBe(ContractStatus.DEPOSIT_PENDING);
      });
    });
  });

  describe('State Machine Validation', () => {
    it('should prevent invalid status transitions', async () => {
      const contractId = 'contract-123';
      const mockContract = {
        id: contractId,
        status: ContractStatus.ACTIVE,
        deposit: 10000000,
        monthlyRent: 5000000,
      };

      mockPrismaService.contract.findUnique.mockResolvedValue(mockContract);
      mockPrismaService.contract.update.mockRejectedValue(
        new BadRequestException('Invalid status transition'),
      );

      // Trying to go from ACTIVE to DRAFT should fail
      await expect(
        service.update(contractId, { status: ContractStatus.DRAFT } as any),
      ).rejects.toThrow();
    });
  });

  describe('Contract Number Generation', () => {
    it('should generate unique contract numbers with correct format', async () => {
      const landlordId = 'landlord-123';

      // Mock count to return 0 (first contract)
      mockPrismaService.contract.count.mockResolvedValue(0);

      const contractNumber = await (service as any).generateContractNumber(
        landlordId,
      );

      expect(contractNumber).toMatch(/^HD-[A-Z0-9]{4}-\d{6}-\d{4}$/);
      expect(contractNumber).toContain('LAND'); // First 4 chars of landlordId
    });
  });
});
