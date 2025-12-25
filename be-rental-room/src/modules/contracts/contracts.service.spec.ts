import { Test, TestingModule } from '@nestjs/testing';
import { ContractsService } from './contracts.service';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { faker } from '@faker-js/faker';
import { ApplicationStatus, ContractStatus } from './entities';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from 'src/common/services/email.service';

describe('ContractsService', () => {
  let service: ContractsService;
  let prismaService: PrismaService;

  const mockRentalApplication = {
    id: faker.string.uuid(),
    roomId: faker.string.uuid(),
    tenantId: faker.string.uuid(),
    landlordId: faker.string.uuid(),
    status: ApplicationStatus.PENDING,
    requestedMoveInDate: new Date('2024-02-01'),
    message: 'I would like to rent this room',
    applicationDate: new Date(),
    reviewedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockContract = {
    id: faker.string.uuid(),
    applicationId: faker.string.uuid(),
    roomId: faker.string.uuid(),
    tenantId: faker.string.uuid(),
    landlordId: faker.string.uuid(),
    contractNumber: 'CTR-2024-001',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    monthlyRent: 5000000,
    deposit: 10000000,
    status: ContractStatus.ACTIVE,
    eSignatureUrl: 'https://example.com/signature.pdf',
    terminatedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    rentalApplication: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    contract: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: NotificationsService,
          useValue: { create: jest.fn() },
        },
        {
          provide: EmailService,
          useValue: {
            sendRentalApplicationNotification: jest.fn(),
            sendRentalApplicationStatusEmail: jest.fn(),
            sendEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ContractsService>(ContractsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rental Applications', () => {
    describe('createApplication', () => {
      it('should create a new rental application', async () => {
        const createDto = {
          roomId: mockRentalApplication.roomId,
          tenantId: mockRentalApplication.tenantId,
          landlordId: mockRentalApplication.landlordId,
          requestedMoveInDate: '2024-02-01',
          message: mockRentalApplication.message,
        };

        mockPrismaService.rentalApplication.create.mockResolvedValue(
          mockRentalApplication,
        );

        const result = await service.createApplication(createDto);

        expect(prismaService.rentalApplication.create).toHaveBeenCalledWith({
          data: createDto,
        });
        expect(result).toBeDefined();
      });
    });

    describe('findAllApplications', () => {
      it('should return paginated rental applications', async () => {
        const applications = [
          mockRentalApplication,
          { ...mockRentalApplication, id: faker.string.uuid() },
        ];

        mockPrismaService.rentalApplication.findMany.mockResolvedValue(
          applications,
        );
        mockPrismaService.rentalApplication.count.mockResolvedValue(2);

        const result = await service.findAllApplications({
          page: 1,
          limit: 10,
          skip: 0,
        });

        expect(result.data).toHaveLength(2);
        expect(result.meta.total).toBe(2);
        expect(result.meta.page).toBe(1);
      });

      it('should filter applications by status', async () => {
        const approvedApp = {
          ...mockRentalApplication,
          status: ApplicationStatus.APPROVED,
        };

        mockPrismaService.rentalApplication.findMany.mockResolvedValue([
          approvedApp,
        ]);
        mockPrismaService.rentalApplication.count.mockResolvedValue(1);

        await service.findAllApplications({
          page: 1,
          limit: 10,
          status: ApplicationStatus.APPROVED,
          skip: 0,
        });

        expect(prismaService.rentalApplication.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              status: ApplicationStatus.APPROVED,
            }),
          }),
        );
      });

      it('should filter applications by tenantId', async () => {
        mockPrismaService.rentalApplication.findMany.mockResolvedValue([
          mockRentalApplication,
        ]);
        mockPrismaService.rentalApplication.count.mockResolvedValue(1);

        await service.findAllApplications({
          page: 1,
          limit: 10,
          tenantId: mockRentalApplication.tenantId,
          skip: 0,
        });

        expect(prismaService.rentalApplication.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              tenantId: mockRentalApplication.tenantId,
            }),
          }),
        );
      });
    });

    describe('findOneApplication', () => {
      it('should return an application by id', async () => {
        mockPrismaService.rentalApplication.findUnique.mockResolvedValue(
          mockRentalApplication,
        );

        const result = await service.findOneApplication(
          mockRentalApplication.id,
        );

        expect(result).toBeDefined();
        expect(prismaService.rentalApplication.findUnique).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: mockRentalApplication.id },
          }),
        );
      });

      it('should throw NotFoundException if application not found', async () => {
        mockPrismaService.rentalApplication.findUnique.mockResolvedValue(null);

        await expect(
          service.findOneApplication('non-existent-id'),
        ).rejects.toThrow(NotFoundException);
      });
    });

    describe('approveApplication', () => {
      it('should approve an application', async () => {
        const approvedApp = {
          ...mockRentalApplication,
          status: ApplicationStatus.APPROVED,
          reviewedAt: new Date(),
        };

        mockPrismaService.rentalApplication.findUnique.mockResolvedValue(
          mockRentalApplication,
        );
        mockPrismaService.rentalApplication.update.mockResolvedValue({
          ...approvedApp,
          tenant: {
            user: {
              id: faker.string.uuid(),
              fullName: 'Tenant A',
              email: 'tenant@example.com',
            },
          },
          room: {
            roomNumber: 'R101',
            property: {
              landlord: {
                user: {
                  id: faker.string.uuid(),
                  fullName: 'LL A',
                  email: 'll@example.com',
                },
              },
            },
          },
        });

        const result = await service.approveApplication(
          mockRentalApplication.id,
        );

        expect(prismaService.rentalApplication.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: mockRentalApplication.id },
            data: expect.objectContaining({
              status: ApplicationStatus.APPROVED,
              reviewedAt: expect.any(Date),
            }),
          }),
        );
      });
    });

    describe('rejectApplication', () => {
      it('should reject an application', async () => {
        const rejectedApp = {
          ...mockRentalApplication,
          status: ApplicationStatus.REJECTED,
          reviewedAt: new Date(),
        };

        mockPrismaService.rentalApplication.findUnique.mockResolvedValue(
          mockRentalApplication,
        );
        mockPrismaService.rentalApplication.update.mockResolvedValue({
          ...rejectedApp,
          tenant: {
            user: {
              id: faker.string.uuid(),
              fullName: 'Tenant A',
              email: 'tenant@example.com',
            },
          },
          room: {
            roomNumber: 'R101',
            property: {
              landlord: {
                user: {
                  id: faker.string.uuid(),
                  fullName: 'LL A',
                  email: 'll@example.com',
                },
              },
            },
          },
        });

        const result = await service.rejectApplication(
          mockRentalApplication.id,
        );

        expect(prismaService.rentalApplication.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: mockRentalApplication.id },
            data: expect.objectContaining({
              status: ApplicationStatus.REJECTED,
              reviewedAt: expect.any(Date),
            }),
          }),
        );
      });
    });
  });

  describe('Contracts', () => {
    describe('create', () => {
      it('should create a new contract', async () => {
        const createDto = {
          applicationId: mockContract.applicationId,
          roomId: mockContract.roomId,
          tenantId: mockContract.tenantId,
          landlordId: mockContract.landlordId,
          contractNumber: mockContract.contractNumber,
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          monthlyRent: mockContract.monthlyRent,
          depositAmount: mockContract.deposit,
        };

        mockPrismaService.contract.create.mockResolvedValue(mockContract);

        const result = await service.create(createDto);

        expect(prismaService.contract.create).toHaveBeenCalledWith({
          data: createDto,
        });
        expect(result).toBeDefined();
      });
    });

    describe('findAll', () => {
      it('should return paginated contracts', async () => {
        const contracts = [
          mockContract,
          { ...mockContract, id: faker.string.uuid() },
        ];

        mockPrismaService.contract.findMany.mockResolvedValue(contracts);
        mockPrismaService.contract.count.mockResolvedValue(2);

        const result = await service.findAll({
          page: 1,
          limit: 10,
          skip: 0,
        });

        expect(result.data).toHaveLength(2);
        expect(result.meta.total).toBe(2);
        expect(result.meta.page).toBe(1);
      });

      it('should filter contracts by status', async () => {
        mockPrismaService.contract.findMany.mockResolvedValue([mockContract]);
        mockPrismaService.contract.count.mockResolvedValue(1);

        await service.findAll({
          page: 1,
          limit: 10,
          status: ContractStatus.ACTIVE,
          skip: 0,
        });

        expect(prismaService.contract.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              status: ContractStatus.ACTIVE,
            }),
          }),
        );
      });

      it('should filter contracts by tenantId', async () => {
        mockPrismaService.contract.findMany.mockResolvedValue([mockContract]);
        mockPrismaService.contract.count.mockResolvedValue(1);

        await service.findAll({
          page: 1,
          limit: 10,
          tenantId: mockContract.tenantId,
          skip: 0,
        });

        expect(prismaService.contract.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              tenantId: mockContract.tenantId,
            }),
          }),
        );
      });

      it('should search contracts by contract number', async () => {
        mockPrismaService.contract.findMany.mockResolvedValue([mockContract]);
        mockPrismaService.contract.count.mockResolvedValue(1);

        await service.findAll({
          page: 1,
          limit: 10,
          search: 'CTR-2024',
          skip: 0,
        });

        expect(prismaService.contract.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              contractNumber: expect.objectContaining({
                contains: 'CTR-2024',
                mode: 'insensitive',
              }),
            }),
          }),
        );
      });
    });

    describe('findOne', () => {
      it('should return a contract by id', async () => {
        mockPrismaService.contract.findUnique.mockResolvedValue({
          ...mockContract,
          tenant: { userId: mockContract.tenantId },
          landlord: { userId: mockContract.landlordId },
        });

        const result = await service.findOne(mockContract.id);

        expect(result).toBeDefined();
        expect(prismaService.contract.findUnique).toHaveBeenCalledWith({
          where: { id: mockContract.id },
        });
      });

      it('should throw NotFoundException if contract not found', async () => {
        mockPrismaService.contract.findUnique.mockResolvedValue(null);

        await expect(service.findOne('non-existent-id')).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe('update', () => {
      it('should update a contract', async () => {
        const updateDto = { monthlyRent: 6000000 };
        const updatedContract = { ...mockContract, monthlyRent: 6000000 };

        mockPrismaService.contract.findUnique.mockResolvedValue(mockContract);
        mockPrismaService.contract.update.mockResolvedValue(updatedContract);

        const result = await service.update(mockContract.id, updateDto);

        expect(prismaService.contract.update).toHaveBeenCalledWith({
          where: { id: mockContract.id },
          data: updateDto,
        });
      });
    });

    describe('terminate', () => {
      it('should terminate a contract', async () => {
        const terminatedContract = {
          ...mockContract,
          status: ContractStatus.TERMINATED,
          terminatedAt: new Date(),
        };

        mockPrismaService.contract.findUnique.mockResolvedValue({
          ...mockContract,
          tenant: {
            userId: mockContract.tenantId,
            user: {
              id: mockContract.tenantId,
              email: 't@example.com',
              fullName: 'Tenant',
            },
          },
          landlord: {
            userId: mockContract.landlordId,
            user: {
              id: mockContract.landlordId,
              email: 'l@example.com',
              fullName: 'LL',
            },
          },
          room: {
            roomNumber: 'R101',
            property: {
              address: '123 Test',
              landlord: {
                user: {
                  id: mockContract.landlordId,
                  email: 'l@example.com',
                  fullName: 'LL',
                },
              },
            },
          },
        });
        mockPrismaService.contract.update.mockResolvedValue({
          ...terminatedContract,
          tenant: {
            user: {
              id: mockContract.tenantId,
              email: 't@example.com',
              fullName: 'Tenant',
            },
          },
          landlord: {
            user: {
              id: mockContract.landlordId,
              email: 'l@example.com',
              fullName: 'LL',
            },
          },
          room: {
            roomNumber: 'R101',
            property: {
              name: 'Test Property',
              landlord: {
                user: {
                  id: mockContract.landlordId,
                  email: 'l@example.com',
                  fullName: 'LL',
                },
              },
            },
          },
        });

        const result = await service.terminate(
          mockContract.id,
          mockContract.tenantId,
          { reason: 'Test', noticeDays: 30 },
        );

        expect(prismaService.contract.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: mockContract.id },
            data: expect.objectContaining({
              status: ContractStatus.TERMINATED,
              terminatedAt: expect.any(Date),
            }),
          }),
        );
      });
    });

    describe('remove', () => {
      it('should delete a contract', async () => {
        mockPrismaService.contract.findUnique.mockResolvedValue(mockContract);
        mockPrismaService.contract.delete.mockResolvedValue(mockContract);

        const result = await service.remove(mockContract.id);

        expect(prismaService.contract.delete).toHaveBeenCalledWith({
          where: { id: mockContract.id },
        });
        expect(result).toEqual({ message: 'Contract deleted successfully' });
      });
    });
  });
});
