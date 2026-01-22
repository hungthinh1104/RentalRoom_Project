import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import {
  Prisma,
  InvoiceStatus,
  UserRole,
  ContractStatus,
  PrismaClient,
} from '@prisma/client';
import { PrismaService } from 'src/database/prisma/prisma.service';
import {
  CreateContractDto,
  ContractResponseDto,
  FilterContractsDto,
  TerminateContractDto,
  UpdateHandoverChecklistDto,
  UpdateContractDto,
  HandoverStage,
  RenewContractDto,
} from '../dto';
import { PaginatedResponse } from 'src/shared/dtos';
import { plainToClass } from 'class-transformer';
import { ApplicationStatus } from '../entities';
import { NotificationsService } from '../../notifications/notifications.service';
import { EmailService } from 'src/common/services/email.service';
import { NotificationType } from '../../notifications/entities/notification.entity';
import { PaymentService } from '../../payments/payment.service';
import { SnapshotService } from '../../snapshots/snapshot.service';
import { CreateContractResidentDto } from '../dto/create-contract-resident.dto';
import { UpdateContractResidentDto } from '../dto/update-contract-resident.dto';
import { RoomStatus } from '../../rooms/entities/room.entity';
import { User } from '../../users/entities';
import { v4 as uuidv4 } from 'uuid';
import { EventStoreService } from 'src/shared/event-sourcing/event-store.service';
import { StateMachineGuard } from 'src/shared/state-machine/state-machine.guard';
import { ImmutabilityGuard } from 'src/shared/guards/immutability.guard';

@Injectable()
export class ContractLifecycleService {
  private readonly logger = new Logger(ContractLifecycleService.name);

  private readonly allowedTransitions: Record<ContractStatus, string[]> = {
    [ContractStatus.DRAFT]: ['send', 'requestChanges', 'update', 'delete'],
    [ContractStatus.PENDING_SIGNATURE]: ['tenantApprove', 'revoke'],
    [ContractStatus.DEPOSIT_PENDING]: ['verifyPayment', 'terminate'],
    [ContractStatus.ACTIVE]: ['terminate', 'renew', 'handover'],
    [ContractStatus.TERMINATED]: [],
    [ContractStatus.EXPIRED]: ['renew'],
    [ContractStatus.CANCELLED]: [],
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
    private readonly paymentService: PaymentService,
    private readonly snapshotService: SnapshotService,
    private readonly eventStore: EventStoreService,
    private readonly stateMachine: StateMachineGuard,
    private readonly immutability: ImmutabilityGuard,
  ) {}

  /**
   * Enforce allowed transitions for contract state machine
   */
  private ensureAllowedTransition(status: ContractStatus, action: string) {
    const allowed = this.allowedTransitions[status] || [];
    if (!allowed.includes(action)) {
      throw new BadRequestException(
        `Action ${action} not allowed when contract status is ${status}`,
      );
    }
  }

  /**
   * Advisory lock to serialize per-key critical sections (Postgres only)
   */
  private async acquireLock(
    tx: any,
    key: string,
  ) {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`;
  }

  /**
   * Transaction-scoped contract loader to avoid mixed connections
   */
  private async findOneTx(
    tx: any,
    id: string,
  ) {
    const contract = await tx.contract.findUnique({
      where: { id },
      include: {
        tenant: { include: { user: true } },
        landlord: { include: { user: true } },
        room: {
          include: {
            property: { include: { landlord: { include: { user: true } } } },
          },
        },
        residents: true,
        invoices: true,
      },
    });

    if (!contract) {
      throw new NotFoundException(`Contract with ID ${id} not found`);
    }

    return contract;
  }

  private assertRefundInvariant(
    refundAmount: number,
    deposit: number,
    unpaidAmount: number,
    totalDeductions: number,
    penalty: number,
  ) {
    const maxReturnable = Math.max(
      deposit + penalty - unpaidAmount - totalDeductions,
      0,
    );
    if (refundAmount > maxReturnable) {
      throw new BadRequestException(
        `Refund exceeds allowable amount. Max: ${maxReturnable.toFixed(2)}`,
      );
    }
  }

  /**
   * Auto-generate unique contract number with transaction safety + retry
   * 🔒 CRITICAL: Handles race conditions with advisory lock + DB unique constraint
   */
  private async generateContractNumber(landlordId: string): Promise<string> {
    const landlordPrefix = landlordId.slice(0, 4).toUpperCase();
    const date = new Date();
    const yearMonth = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
    const lockKey = `contract-number:${landlordId}:${yearMonth}`;

    // Retry up to 3 times if unique constraint fails
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        return await this.prisma.$transaction(async (tx) => {
          // Serialize per landlord+month to avoid duplicate numbers under concurrency
          await this.acquireLock(tx, lockKey);

          const count = await tx.contract.count({
            where: {
              landlordId,
              contractNumber: { startsWith: `HD-${landlordPrefix}-${yearMonth}` },
            },
          });

          const sequence = String(count + 1).padStart(4, '0');
          return `HD-${landlordPrefix}-${yearMonth}-${sequence}`;
        });
      } catch (error) {
        // If unique constraint violation, retry with exponential backoff
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          if (attempt < 3) {
            // Wait before retry: 10ms, 20ms, 40ms
            await new Promise((r) =>
              setTimeout(r, Math.pow(2, attempt - 1) * 10),
            );
            continue;
          }
        }
        throw error;
      }
    }

    // Fallback (should not reach here)
    throw new Error(
      `Failed to generate unique contract number after 3 attempts`,
    );
  }

  async findOne(id: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        tenant: { include: { user: true } },
        landlord: { include: { user: true } },
        room: { include: { property: true } },
        residents: true,
        invoices: true,
      },
    });

    if (!contract) {
      throw new NotFoundException(`Contract with ID ${id} not found`);
    }

    return contract;
  }

  async findAllContracts(filterDto: FilterContractsDto, user?: User) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'startDate',
      sortOrder = 'desc',
      landlordId,
      tenantId,
      roomId,
      status,
      search,
    } = filterDto;

    const where: any = {};

    // Ownership filter
    if (user) {
      if (user.role === UserRole.LANDLORD) {
        const landlord = await this.prisma.landlord.findUnique({
          where: { userId: user.id },
        });
        if (!landlord)
          throw new BadRequestException('Landlord profile not found');
        where.landlordId = landlord.userId;
      } else if (user.role === UserRole.TENANT) {
        const tenant = await this.prisma.tenant.findUnique({
          where: { userId: user.id },
        });
        if (!tenant) throw new BadRequestException('Tenant profile not found');
        where.tenantId = tenant.userId;
      }
    }

    if (landlordId && (!user || user.role === UserRole.ADMIN))
      where.landlordId = landlordId;
    if (tenantId) where.tenantId = tenantId;
    if (roomId) where.roomId = roomId;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { contractNumber: { contains: search, mode: 'insensitive' } },
        { room: { roomNumber: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [contracts, total] = await Promise.all([
      this.prisma.contract.findMany({
        where,
        skip: filterDto.skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          tenant: { include: { user: true } },
          landlord: { include: { user: true } },
          room: { include: { property: true } },
          residents: true,
        },
      }),
      this.prisma.contract.count({ where }),
    ]);

    const transformed = contracts.map((c) => this.transformToDto(c));

    return new PaginatedResponse(transformed, total, page, limit);
  }

  async getContractDetails(id: string) {
    const contract = await this.findOne(id);
    return this.transformToDto(contract);
  }

  private transformToDto(contract: any): ContractResponseDto {
    const cleaned = {
      ...contract,
      deposit: contract.deposit ? Number(contract.deposit) : 0,
      monthlyRent: contract.monthlyRent ? Number(contract.monthlyRent) : 0,
      residents: contract.residents || [],
    };
    return plainToClass(ContractResponseDto, cleaned, {
      excludeExtraneousValues: true,
    });
  }

  // --- Creation & Sending ---

  async create(createContractDto: CreateContractDto) {
    const paymentConfig = await this.prisma.paymentConfig.findUnique({
      where: { landlordId: createContractDto.landlordId },
    });

    if (!paymentConfig || !paymentConfig.isActive) {
      throw new BadRequestException(
        'Vui lòng cấu hình tài khoản nhận tiền trước khi tạo hợp đồng.',
      );
    }

    const { residents, ...contractData } = createContractDto;

    const contractNumber =
      contractData.contractNumber ||
      (await this.generateContractNumber(createContractDto.landlordId));

    const paymentRef = contractNumber
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase();
    const depositDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const contract = await this.prisma.$transaction(async (tx) => {
      const room = await tx.room.findUnique({
        where: { id: contractData.roomId },
      });
      if (room?.status !== RoomStatus.AVAILABLE) {
        throw new BadRequestException('Phòng không còn trống.');
      }

      const newContract = await tx.contract.create({
        data: {
          ...contractData,
          applicationId: contractData.applicationId!,
          contractNumber,
          status: ContractStatus.DEPOSIT_PENDING,
          paymentRef,
          depositDeadline,
          residents:
            residents && residents.length > 0
              ? { create: residents }
              : undefined,
        },
        include: { residents: true },
      });

      await tx.room.update({
        where: { id: contractData.roomId },
        data: { status: RoomStatus.DEPOSIT_PENDING },
      });

      return newContract;
    });

    this.sendPaymentInstructionEmail(
      contract,
      createContractDto.tenantId,
      contractNumber,
      paymentRef,
      depositDeadline,
    );

    return this.transformToDto(contract);
  }

  private async sendPaymentInstructionEmail(
    contract: any,
    tenantId: string,
    contractNumber: string,
    paymentRef: string,
    deadline: Date,
  ) {
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { userId: tenantId },
        include: { user: true },
      });
      if (tenant) {
        await this.emailService.sendEmail(
          tenant.user.email,
          `Hợp đồng ${contractNumber} - Hướng dẫn thanh toán`,
          `
            <h2>Hợp đồng thuê phòng đã được tạo</h2>
            <p>Xin chào ${tenant.user.fullName},</p>
            <p>Hợp đồng <strong>${contractNumber}</strong> đã được tạo thành công.</p>
            <h3>Thông tin thanh toán:</h3>
            <ul>
              <li><strong>Số tiền cọc:</strong> ${Number(contract.deposit).toLocaleString('vi-VN')} VNĐ</li>
              <li><strong>Mã thanh toán:</strong> ${paymentRef}</li>
              <li><strong>Hạn thanh toán:</strong> ${deadline.toLocaleString('vi-VN')}</li>
            </ul>
            <p>Vui lòng chuyển khoản với nội dung: <strong>${paymentRef}</strong></p>
          `,
        );
      }
    } catch (e) {
      this.logger.warn(`Failed to send payment email: ${e}`);
    }
  }

  async sendContract(contractId: string, landlordUserId: string) {
    const updatedContract = await this.prisma.$transaction(async (tx) => {
      const contract = await this.findOneTx(tx, contractId);

      if (contract.landlord.userId !== landlordUserId) {
        throw new UnauthorizedException(
          'You are not authorized to send this contract',
        );
      }

      this.ensureAllowedTransition(contract.status, 'send');

      const room = await tx.room.findUnique({ where: { id: contract.roomId } });
      if (!room) throw new NotFoundException('Room not found');

      if (
        room.status !== RoomStatus.AVAILABLE &&
        room.status !== RoomStatus.DEPOSIT_PENDING
      ) {
        throw new BadRequestException('Room is not available for deposit');
      }

      await tx.room.update({
        where: { id: contract.roomId },
        data: { status: RoomStatus.DEPOSIT_PENDING },
      });

      return tx.contract.update({
        where: { id: contractId },
        data: { status: ContractStatus.PENDING_SIGNATURE },
        include: {
          tenant: { include: { user: true } },
          landlord: { include: { user: true } },
          room: true,
        },
      });
    });

    // Fire-and-forget notification after commit
    void this.notificationsService
      .create({
        userId: updatedContract.tenant.userId,
        title: `Hợp đồng cần ký - ${updatedContract.contractNumber}`,
        content: `Chủ nhà ${updatedContract.landlord.user.fullName} đã gửi hợp đồng. Vui lòng xem và phê duyệt.`,
        notificationType: NotificationType.CONTRACT,
        relatedEntityId: contractId,
        isRead: false,
      })
      .catch((error) => this.logger.warn(`Failed to notify tenant: ${error}`));

    return updatedContract;
  }

  // --- Revoke / Reject ---
  async revokeContract(contractId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const contract = await this.findOneTx(tx, contractId);
      const isLandlord = contract.landlord.userId === userId;
      const isTenant = contract.tenant.userId === userId;

      if (!isLandlord && !isTenant)
        throw new UnauthorizedException('Not authorized');

      this.ensureAllowedTransition(contract.status, 'revoke');

      const targetStatus = isLandlord
        ? ContractStatus.DRAFT
        : ContractStatus.CANCELLED;

      await tx.room.update({
        where: { id: contract.roomId },
        data: { status: RoomStatus.AVAILABLE },
      });

      return tx.contract.update({
        where: { id: contractId },
        data: { status: targetStatus },
      });
    });
  }

  async requestChanges(contractId: string, tenantId: string, reason: string) {
    return this.prisma.$transaction(async (tx) => {
      const contract = await this.findOneTx(tx, contractId);
      this.ensureAllowedTransition(contract.status, 'requestChanges');

      if (contract.tenant.userId !== tenantId) {
        throw new UnauthorizedException('Not authorized');
      }

      await tx.room.update({
        where: { id: contract.roomId },
        data: { status: RoomStatus.AVAILABLE },
      });
      return await tx.contract.update({
        where: { id: contractId },
        data: { status: ContractStatus.DRAFT, lastNegotiationNote: reason },
      });
    });
  }

  async tenantApproveContract(contractId: string, tenantId: string) {
    const contract = await this.findOne(contractId);
    if (contract.tenantId !== tenantId)
      throw new UnauthorizedException('Not authorized');

    this.ensureAllowedTransition(contract.status, 'tenantApprove');

    // 🔒 STATE MACHINE: Validate transition PENDING_SIGNATURE → DEPOSIT_PENDING
    this.stateMachine.validateTransition(
      'CONTRACT',
      contractId,
      contract.status,
      'DEPOSIT_PENDING',
      tenantId,
      'Tenant approved contract',
    );

    const paymentRef = `HD${contract.contractNumber}`
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase();
    const depositDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const updated = await this.prisma.$transaction(async (tx) => {
      const correlationId = uuidv4();

      const result = await tx.contract.update({
        where: { id: contractId },
        data: {
          status: ContractStatus.DEPOSIT_PENDING,
          paymentRef,
          depositDeadline,
        },
        include: { tenant: { include: { user: true } } },
      });

      // EVENT STORE: Record contract approval
      await this.eventStore.append({
        eventId: uuidv4(),
        eventType: 'CONTRACT_APPROVED',
        correlationId,
        aggregateId: contractId,
        aggregateType: 'CONTRACT',
        aggregateVersion: 1,
        payload: {
          contractId,
          tenantId,
          paymentRef,
          depositDeadline,
        },
        metadata: {
          userId: tenantId,
          userRole: 'TENANT',
          timestamp: new Date(),
          source: 'API',
        },
      });

      return result;
    });

    // Notify landlord
    try {
      await this.notificationsService.create({
        userId: contract.landlordId,
        title: `Hợp đồng đã được phê duyệt - ${contract.contractNumber}`,
        content: `${updated.tenant.user.fullName} đã phê duyệt hợp đồng. Chờ thanh toán tiền cọc.`,
        notificationType: NotificationType.CONTRACT,
        relatedEntityId: contractId,
        isRead: false,
      });
    } catch (error) {
      this.logger.warn(`Failed to notify landlord: ${error}`);
    }

    return updated;
  }

  async verifyPaymentStatus(id: string) {
    return this.prisma.$transaction(async (tx) => {
      await this.acquireLock(tx, `contract:${id}:payment`);
      const contract = await this.findOneTx(tx, id);

      if (contract.status === ContractStatus.ACTIVE)
        return { success: true, status: ContractStatus.ACTIVE };

      this.ensureAllowedTransition(contract.status, 'verifyPayment');

      if (contract.status !== ContractStatus.DEPOSIT_PENDING)
        return { success: false, status: contract.status };

      const expectedAmount = Number(contract.deposit);
      const paymentResult = await this.paymentService.verifyPayment(
        contract,
        expectedAmount,
      );

      if (!paymentResult.success) {
        return { success: false, status: contract.status };
      }

      const invoiceNumber = `INV-${contract.contractNumber}-DEP`;
      const existingInvoice = await tx.invoice.findFirst({
        where: { invoiceNumber },
      });

      const invoice =
        existingInvoice ||
        (await tx.invoice.create({
          data: {
            contractId: contract.id,
            tenantId: contract.tenantId,
            invoiceNumber,
            issueDate: new Date(),
            dueDate: new Date(),
            totalAmount: contract.deposit,
            status: InvoiceStatus.PAID,
            paidAt: new Date(),
            lineItems: {
              create: {
                itemType: 'OTHER',
                description: 'Tiền cọc hợp đồng',
                quantity: 1,
                unitPrice: contract.deposit,
                amount: contract.deposit,
              },
            },
          },
        }));

      const existingPayment = await tx.payment.findFirst({
        where: { invoiceId: invoice.id, status: 'COMPLETED' },
      });

      const paymentRecord =
        existingPayment ||
        (await tx.payment.create({
          data: {
            amount: contract.deposit,
            paymentMethod: 'BANK_TRANSFER',
            paymentDate: new Date(),
            status: 'COMPLETED',
            invoiceId: invoice.id,
            tenantId: contract.tenantId,
            paidAt: new Date(),
          },
        }));

      await tx.contract.update({
        where: { id },
        data: { status: ContractStatus.ACTIVE, depositDeadline: null },
      });

      // 🔒 STATE MACHINE: Validate transition DEPOSIT_PENDING → ACTIVE
      this.stateMachine.validateTransition(
        'CONTRACT',
        id,
        ContractStatus.DEPOSIT_PENDING,
        ContractStatus.ACTIVE,
        contract.tenantId,
        'Deposit verified',
      );

      // EVENT STORE: Record contract activation
      const correlationId = uuidv4();
      await this.eventStore.append({
        eventId: uuidv4(),
        eventType: 'CONTRACT_ACTIVATED',
        correlationId,
        aggregateId: id,
        aggregateType: 'CONTRACT',
        aggregateVersion: 1,
        payload: {
          contractId: id,
          depositAmount: contract.deposit,
          paymentRecord: paymentRecord.id,
          invoiceId: invoice.id,
        },
        metadata: {
          userId: contract.tenantId,
          userRole: UserRole.TENANT,
          timestamp: new Date(),
          source: 'API',
        },
      });

      await tx.room.update({
        where: { id: contract.roomId },
        data: { status: RoomStatus.OCCUPIED },
      });

      if (contract.applicationId) {
        await tx.rentalApplication.update({
          where: { id: contract.applicationId },
          data: {
            status: ApplicationStatus.COMPLETED,
            contractId: contract.id,
          },
        });
        await tx.rentalApplication.updateMany({
          where: {
            roomId: contract.roomId,
            status: ApplicationStatus.PENDING,
            id: { not: contract.applicationId },
          },
          data: {
            status: ApplicationStatus.REJECTED,
            rejectionReason: 'Phòng đã được thuê bởi người khác',
            reviewedAt: new Date(),
          },
        });
      }

      // Snapshots (MANDATORY - fail-fast, cannot proceed without legal audit trail)
      // Contract signature event
      const snapshotId = await this.snapshotService.create(
        {
          actorId: contract.tenantId,
          actorRole: UserRole.TENANT,
          actionType: 'contract_signed',
          entityType: 'CONTRACT',
          entityId: contract.id,
          metadata: {},
        },
        tx,
      );
      await tx.contract.update({
        where: { id: contract.id },
        data: { snapshotId },
      });

      // Payment success event
      const paymentSnapshotId = await this.snapshotService.create(
        {
          actorId: contract.tenantId,
          actorRole: UserRole.TENANT,
          actionType: 'payment_succeeded',
          entityType: 'PAYMENT',
          entityId: paymentRecord.id,
          metadata: {},
        },
        tx,
      );
      await tx.payment.update({
        where: { id: paymentRecord.id },
        data: { snapshotId: paymentSnapshotId },
      });

      return { success: true, status: ContractStatus.ACTIVE };
    });
  }

  async addResident(
    contractId: string,
    dto: CreateContractResidentDto,
    userId: string,
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        const contract = await tx.contract.findUnique({
          where: { id: contractId },
          include: {
            room: true,
            residents: true,
            tenant: true,
            landlord: true,
          },
        });

        if (!contract) throw new NotFoundException('Contract not found');
        if (
          contract.tenant.userId !== userId &&
          contract.landlord.userId !== userId
        ) {
          throw new ForbiddenException('Not authorized');
        }

        if (contract.residents.length >= (contract.room.maxOccupants || 99)) {
          throw new BadRequestException('Room capacity exceeded');
        }

        // Prevent duplicate citizenId
        if (dto.citizenId) {
          const duplicate = contract.residents.find(
            (r) => r.citizenId === dto.citizenId,
          );
          if (duplicate) {
            throw new BadRequestException(
              `Resident with Citizen ID ${dto.citizenId} already exists in this contract`,
            );
          }
        }

        return tx.contractResident.create({
          data: {
            contractId,
            fullName: dto.fullName,
            phoneNumber: dto.phoneNumber,
            citizenId: dto.citizenId,
            relationship: dto.relationship,
          },
        });
      },
      { isolationLevel: 'Serializable' },
    );
  }

  async removeResident(contractId: string, residentId: string, userId: string) {
    const resident = await this.prisma.contractResident.findUnique({
      where: { id: residentId },
      include: { contract: { include: { tenant: true, landlord: true } } },
    });

    if (!resident) throw new NotFoundException('Resident not found');
    if (resident.contractId !== contractId)
      throw new BadRequestException('Diff contract');

    if (
      resident.contract.tenant.userId !== userId &&
      resident.contract.landlord.userId !== userId
    ) {
      throw new ForbiddenException('Not authorized');
    }

    return this.prisma.contractResident.delete({ where: { id: residentId } });
  }

  async updateResident(
    contractId: string,
    residentId: string,
    dto: UpdateContractResidentDto,
    userId: string,
  ) {
    const resident = await this.prisma.contractResident.findUnique({
      where: { id: residentId },
      include: {
        contract: {
          include: {
            tenant: true,
            landlord: true,
            residents: true,
          },
        },
      },
    });

    if (!resident) throw new NotFoundException('Resident not found');
    if (resident.contractId !== contractId)
      throw new BadRequestException(
        'Resident does not belong to this contract',
      );

    if (
      resident.contract.tenant.userId !== userId &&
      resident.contract.landlord.userId !== userId
    ) {
      throw new ForbiddenException('Not authorized');
    }

    // Check duplicate citizenId if updating
    if (dto.citizenId && dto.citizenId !== resident.citizenId) {
      const duplicate = resident.contract.residents.find(
        (r) => r.citizenId === dto.citizenId && r.id !== residentId,
      );
      if (duplicate) {
        throw new BadRequestException(
          `Resident with Citizen ID ${dto.citizenId} already exists in this contract`,
        );
      }
    }

    return this.prisma.contractResident.update({
      where: { id: residentId },
      data: {
        fullName: dto.fullName,
        phoneNumber: dto.phoneNumber,
        citizenId: dto.citizenId,
        relationship: dto.relationship,
      },
    });
  }

  async renew(id: string, userId: string, renewDto: RenewContractDto) {
    return this.prisma.$transaction(async (tx) => {
      const oldContract = await this.findOneTx(tx, id);
      this.ensureAllowedTransition(oldContract.status, 'renew');

      // 🔒 STATE MACHINE: Validate renewal transition
      this.stateMachine.validateTransition(
        'CONTRACT',
        id,
        oldContract.status,
        'DRAFT', // New contract created in DRAFT
        userId,
        'Contract renewal',
      );

      const isLandlord = oldContract.landlord.userId === userId;
      if (!isLandlord) {
        throw new ForbiddenException('Only landlord can renew contract');
      }

      let newRent = Number(oldContract.monthlyRent);
      if (renewDto.newRentPrice) {
        newRent = renewDto.newRentPrice;
      } else if (renewDto.increasePercentage) {
        newRent = newRent * (1 + renewDto.increasePercentage / 100);
      }

      const base = oldContract.contractNumber.split('-').slice(0, 3).join('-');
      await this.acquireLock(tx, `contract:${base}:renewal`);
      const renewalCount = await tx.contract.count({
        where: { contractNumber: { startsWith: `${base}-R` } },
      });
      const suffix = (renewalCount + 1).toString().padStart(3, '0');
      const newContractNumber = `${base}-R${suffix}`;

      const newApplication = await tx.rentalApplication.create({
        data: {
          roomId: oldContract.roomId,
          tenantId: oldContract.tenantId,
          landlordId: oldContract.landlordId,
          status: ApplicationStatus.COMPLETED,
          message: 'Auto-generated for contract renewal',
        },
      });

      const newContract = await tx.contract.create({
        data: {
          applicationId: newApplication.id,
          contractNumber: newContractNumber,
          landlordId: oldContract.landlordId,
          tenantId: oldContract.tenantId,
          roomId: oldContract.roomId,
          startDate: new Date(oldContract.endDate),
          endDate: new Date(renewDto.newEndDate),
          monthlyRent: newRent,
          deposit:
            renewDto.newDeposit !== undefined
              ? renewDto.newDeposit
              : oldContract.deposit,
          paymentDay: oldContract.paymentDay,
          maxOccupants: oldContract.maxOccupants,
          status: ContractStatus.DRAFT,
          previousContractId: oldContract.id,
        },
      });

      // Copy residents
      if (oldContract.residents && oldContract.residents.length > 0) {
        await tx.contractResident.createMany({
          data: oldContract.residents.map((r) => ({
            contractId: newContract.id,
            fullName: r.fullName,
            phoneNumber: r.phoneNumber,
            citizenId: r.citizenId,
            relationship: r.relationship,
          })),
        });
      }

      // EVENT STORE: Record contract renewal
      const correlationId = uuidv4();
      await this.eventStore.append({
        eventId: uuidv4(),
        eventType: 'CONTRACT_RENEWED',
        correlationId,
        aggregateId: newContract.id,
        aggregateType: 'CONTRACT',
        aggregateVersion: 1,
        payload: {
          newContractId: newContract.id,
          oldContractId: oldContract.id,
          newRent,
          oldRent: Number(oldContract.monthlyRent),
          renewalCount: renewalCount + 1,
        },
        metadata: {
          userId,
          userRole: UserRole.LANDLORD,
          timestamp: new Date(),
          source: 'API',
        },
      });

      // 📸 CREATE SNAPSHOT: Contract Renewed (MANDATORY - fail-fast)
      await this.snapshotService.create(
        {
          actorId: userId,
          actorRole: UserRole.LANDLORD,
          actionType: 'contract_renewed',
          entityType: 'CONTRACT',
          entityId: newContract.id,
          metadata: {
            oldContractId: oldContract.id,
            newRent: newRent,
            oldRent: Number(oldContract.monthlyRent),
            renewalCount: renewalCount + 1,
            previousContractNumber: oldContract.contractNumber,
          },
        },
        tx,
      );

      return newContract;
    });
  }

  async terminate(
    id: string,
    userId: string,
    terminateDto: TerminateContractDto,
  ) {
    const result = await this.prisma.$transaction(async (tx) => {
      const contract = await this.findOneTx(tx, id);
      this.ensureAllowedTransition(contract.status, 'terminate');

      // 🛡️ STATE MACHINE: Validate transition ACTIVE → TERMINATED
      this.stateMachine.validateTransition(
        'CONTRACT',
        id,
        contract.status,
        'TERMINATED',
        userId,
        `Termination: ${terminateDto.reason}`,
      );

      const isTenant = contract.tenant.userId === userId;
      const isLandlord = contract.room.property.landlord.userId === userId;

      if (!isTenant && !isLandlord) {
        throw new ForbiddenException('Not authorized');
      }

      const requestedTerminationDate = new Date(terminateDto.terminationDate);
      const noticeDays = terminateDto.noticeDays || 30;
      const earliestAllowedDate = new Date();
      earliestAllowedDate.setDate(earliestAllowedDate.getDate() + noticeDays);

      if (requestedTerminationDate < earliestAllowedDate) {
        throw new BadRequestException(
          `Notice period violation: termination requires at least ${noticeDays} days notice. Earliest allowed date: ${earliestAllowedDate.toLocaleDateString('vi-VN')}`,
        );
      }

      const deposit = Number(contract.deposit);
      const monthlyRent = Number(contract.monthlyRent);
      let totalDeductions = 0;
      const deductionItems: any[] = [];

      const now = new Date();
      const endDate = new Date(contract.endDate);
      const startDate = new Date(contract.startDate);
      const daysRemaining = Math.ceil(
        (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      const isEarlyTermination = daysRemaining > 0;

      // Prorate based on actual occupancy in the termination month
      const daysInMonth = new Date(
        requestedTerminationDate.getFullYear(),
        requestedTerminationDate.getMonth() + 1,
        0,
      ).getDate();
      const monthStart = new Date(
        requestedTerminationDate.getFullYear(),
        requestedTerminationDate.getMonth(),
        1,
      );
      const usageStart = new Date(
        Math.max(startDate.getTime(), monthStart.getTime()),
      );
      const daysUsedInMonth = Math.max(
        1,
        Math.ceil(
          (requestedTerminationDate.getTime() - usageStart.getTime()) /
            (1000 * 60 * 60 * 24),
        ) + 1,
      );
      const proratedRent = (monthlyRent / daysInMonth) * daysUsedInMonth;

      const unpaidInvoices = await tx.invoice.findMany({
        where: {
          contractId: id,
          status: { in: ['PENDING', 'OVERDUE'] },
        },
      });

      const unpaidAmount = unpaidInvoices.reduce(
        (sum, inv) => sum + Number(inv.totalAmount),
        0,
      );

      let penalty = 0;
      let refundAmount = 0;

      if (terminateDto.refundAmount !== undefined && isLandlord) {
        refundAmount = terminateDto.refundAmount;
      } else {
        if (isEarlyTermination) {
          if (isTenant) {
            penalty = deposit;
            refundAmount = 0;
          } else {
            penalty = deposit * 2;
            if (terminateDto.deductions) {
              terminateDto.deductions.forEach((d) => {
                totalDeductions += d.amount;
                deductionItems.push(d);
              });
            }
            refundAmount = Math.max(0, penalty - totalDeductions);
          }
        } else {
          if (isLandlord && terminateDto.deductions) {
            terminateDto.deductions.forEach((d) => {
              totalDeductions += d.amount;
              deductionItems.push(d);
            });
          }
          refundAmount = Math.max(
            0,
            deposit - totalDeductions - proratedRent - unpaidAmount,
          );
        }
      }

      this.assertRefundInvariant(
        refundAmount,
        deposit,
        unpaidAmount,
        totalDeductions,
        penalty,
      );

      await tx.contract.update({
        where: { id },
        data: {
          status: ContractStatus.TERMINATED,
          terminatedAt: new Date(terminateDto.terminationDate),
          terminationDetails: {
            reason: terminateDto.reason,
            terminatedBy: userId,
            noticeDays: terminateDto.noticeDays,
            deductions: deductionItems,
            refundAmount,
            totalDeductions,
            proratedRent: Math.round(proratedRent * 100) / 100,
            unpaidInvoices: unpaidAmount,
            depositReturned: terminateDto.returnDeposit,
          },
        },
      });

      await tx.room.update({
        where: { id: contract.roomId },
        data: { status: RoomStatus.AVAILABLE },
      });

      // 📊 EVENT STORE: Record CONTRACT_TERMINATED event with refund + deduction tracking
      const eventCount = await tx.domainEvent.count({
        where: { aggregateId: id },
      });

      await this.eventStore.append({
        eventId: uuidv4(),
        eventType: 'CONTRACT_TERMINATED',
        correlationId: uuidv4(),
        aggregateId: id,
        aggregateType: 'CONTRACT',
        aggregateVersion: eventCount + 1,
        payload: {
          contractId: id,
          terminatedBy: userId,
          terminatedByRole: isTenant ? 'TENANT' : 'LANDLORD',
          reason: terminateDto.reason,
          terminationDate: terminateDto.terminationDate,
          deposit,
          deductions: deductionItems,
          totalDeductions,
          refundAmount,
          unpaidInvoices: unpaidAmount,
          proratedRent: Math.round(proratedRent * 100) / 100,
          isEarlyTermination,
          noticeDays,
        },
        metadata: {
          userId,
          userRole: isTenant ? 'TENANT' : 'LANDLORD',
          timestamp: new Date(),
          source: 'API',
        },
      });

      // 📸 CREATE SNAPSHOT: Contract Terminated (MANDATORY - fail-fast)
      await this.snapshotService.create(
        {
          actorId: userId,
          actorRole: isTenant ? UserRole.TENANT : UserRole.LANDLORD,
          actionType: 'contract_terminated',
          entityType: 'CONTRACT',
          entityId: id,
          metadata: {
            reason: terminateDto.reason,
            terminationDate: terminateDto.terminationDate,
            refundAmount,
            totalDeductions,
            unpaidAmount,
            proratedRent: Math.round(proratedRent * 100) / 100,
            terminatedBy: isTenant ? 'TENANT' : 'LANDLORD',
          },
        },
        tx,
      );

      return {
        contract,
        isTenant,
        isLandlord,
        refundAmount,
        totalDeductions,
        proratedRent,
        unpaidAmount,
      };
    });

    const roomInfo = `P.${result.contract.room.roomNumber} - ${result.contract.room.property.name}`;
    const landlordUser = result.contract.room.property.landlord.user;

    void (async () => {
      try {
        if (result.isTenant) {
          await this.notificationsService.create({
            userId: landlordUser.id,
            title: `📢 Hợp đồng chấm dứt bởi người thuê - ${roomInfo}`,
            content: `Lý do: ${terminateDto.reason}\nHoàn trả cọc dự kiến: ${result.refundAmount.toLocaleString('vi-VN')} VNĐ`,
            notificationType: NotificationType.CONTRACT,
            relatedEntityId: id,
          });
        } else {
          await this.notificationsService.create({
            userId: result.contract.tenant.userId,
            title: `⚠️ Hợp đồng đã được chấm dứt - ${roomInfo}`,
            content: `Lý do: ${terminateDto.reason}\nHoàn trả cọc: ${result.refundAmount.toLocaleString('vi-VN')} VNĐ\nKhấu trừ: ${result.totalDeductions.toLocaleString('vi-VN')} VNĐ`,
            notificationType: NotificationType.CONTRACT,
            relatedEntityId: id,
          });
        }
      } catch (error) {
        this.logger.warn(`Failed to send notifications: ${error}`);
      }
    })();

    return {
      message: 'Contract terminated successfully',
      contractId: id,
      financials: {
        deposit: Number(result.contract.deposit),
        deductions: result.totalDeductions,
        proratedRent: Math.round(result.proratedRent * 100) / 100,
        unpaidInvoices: result.unpaidAmount,
        refundAmount: result.refundAmount,
      },
    };
  }

  async updateHandoverChecklist(
    id: string,
    userId: string,
    dto: UpdateHandoverChecklistDto,
  ) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: { tenant: true, landlord: true },
    });
    if (!contract) throw new NotFoundException('Contract not found');

    const isTenant = contract.tenant.userId === userId;
    const isLandlord = contract.landlord.userId === userId;

    const currentChecklist = (contract as any).handoverChecklist || {
      checkIn: null,
      checkOut: null,
    };

    if (dto.stage === HandoverStage.CHECK_IN) {
      if (!isLandlord) {
        throw new ForbiddenException('Only landlord can update check-in');
      }
      if (
        currentChecklist.checkIn?.signatureUrl &&
        contract.tenant.userId === userId
      ) {
        throw new BadRequestException('Locked');
      }
      currentChecklist.checkIn = {
        ...dto,
        updatedAt: new Date(),
        updatedBy: userId,
      };
    } else {
      if (!isTenant) {
        throw new ForbiddenException('Only tenant can update check-out');
      }
      currentChecklist.checkOut = {
        ...dto,
        updatedAt: new Date(),
        updatedBy: userId,
      };
    }

    await this.prisma.contract.update({
      where: { id },
      data: { handoverChecklist: currentChecklist } as any,
    });

    return { message: 'Updated', checklist: currentChecklist };
  }

  async update(id: string, updateContractDto: UpdateContractDto, user: User) {
    const existing = await this.prisma.contract.findUnique({
      where: { id },
      select: { landlordId: true },
    });

    if (!existing) {
      throw new NotFoundException(`Contract with ID ${id} not found`);
    }

    if (user.role === UserRole.LANDLORD && existing.landlordId !== user.id) {
      throw new BadRequestException(
        'Landlords can only update their own contracts',
      );
    }

    const {
      tenantId: _tenantId,
      landlordId: _landlordId,
      roomId: _roomId,
      applicationId: _applicationId,
      residents: _residents,
      ...updateData
    } = updateContractDto;

    const contract = await this.prisma.contract.update({
      where: { id },
      data: updateData,
    });

    return this.transformToDto(contract);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.contract.delete({ where: { id } });
    return { message: 'Contract deleted successfully' };
  }
}
