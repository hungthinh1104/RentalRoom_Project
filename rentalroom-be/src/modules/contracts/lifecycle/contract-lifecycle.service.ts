import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import {
  CreateContractDto,
  ContractResponseDto,
  FilterContractsDto,
  TerminateContractDto,
  UpdateHandoverChecklistDto,
  UpdateContractDto,
  HandoverStage,
} from '../dto';
import { PaginatedResponse } from 'src/shared/dtos';
import { plainToClass } from 'class-transformer';
import { ApplicationStatus, ContractStatus } from '../entities';
import { NotificationsService } from '../../notifications/notifications.service';
import { EmailService } from 'src/common/services/email.service';
import { NotificationType } from '../../notifications/entities/notification.entity';
import { PaymentService } from '../../payments/payment.service';
import { SnapshotService } from '../../snapshots/snapshot.service';
import { CreateContractResidentDto } from '../dto/create-contract-resident.dto';
import { InvoiceStatus, UserRole } from '@prisma/client';
import { RoomStatus } from '../../rooms/entities/room.entity';
import { User } from '../../users/entities';

@Injectable()
export class ContractLifecycleService {
  private readonly logger = new Logger(ContractLifecycleService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
    private readonly paymentService: PaymentService,
    private readonly snapshotService: SnapshotService,
  ) {}

  /**
   * Auto-generate unique contract number with transaction safety
   */
  private async generateContractNumber(landlordId: string): Promise<string> {
    const landlordPrefix = landlordId.slice(0, 4).toUpperCase();
    const date = new Date();
    const yearMonth = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;

    return await this.prisma.$transaction(
      async (tx) => {
        const count = await tx.contract.count({
          where: {
            landlordId,
            contractNumber: { startsWith: `HD-${landlordPrefix}-${yearMonth}` },
          },
        });

        const sequence = String(count + 1).padStart(4, '0');
        return `HD-${landlordPrefix}-${yearMonth}-${sequence}`;
      },
      { maxWait: 5000, timeout: 10000 },
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
          status: ContractStatus.DEPOSIT_PENDING as any,
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
        data: { status: RoomStatus.DEPOSIT_PENDING as any },
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
    const contract = await this.findOne(contractId);

    if (contract.landlord.userId !== landlordUserId) {
      throw new UnauthorizedException(
        'You are not authorized to send this contract',
      );
    }

    if (contract.status !== ContractStatus.DRAFT) {
      throw new BadRequestException(
        `Contract must be in DRAFT status to send.`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const room = await tx.room.findUnique({ where: { id: contract.roomId } });
      if (!room) throw new NotFoundException('Room not found');

      if (
        room.status !== RoomStatus.AVAILABLE &&
        room.status !== (RoomStatus.DEPOSIT_PENDING as any)
      ) {
        // Logic check
      }

      await tx.room.update({
        where: { id: contract.roomId },
        data: { status: RoomStatus.DEPOSIT_PENDING as any },
      });

      const updatedContract = await tx.contract.update({
        where: { id: contractId },
        data: { status: ContractStatus.PENDING_SIGNATURE },
        include: {
          tenant: { include: { user: true } },
          landlord: { include: { user: true } },
          room: true,
        },
      });

      try {
        await this.notificationsService.create({
          userId: updatedContract.tenant.userId,
          title: `Hợp đồng cần ký - ${updatedContract.contractNumber}`,
          content: `Chủ nhà ${updatedContract.landlord.user.fullName} đã gửi hợp đồng. Vui lòng xem và phê duyệt.`,
          notificationType: NotificationType.CONTRACT,
          relatedEntityId: contractId,
          isRead: false,
        });
      } catch (error) {
        this.logger.warn(`Failed to notify tenant: ${error}`);
      }

      return updatedContract;
    });
  }

  // --- Revoke / Reject ---
  async revokeContract(contractId: string, userId: string) {
    const contract = await this.findOne(contractId);
    const isLandlord = contract.landlord.userId === userId;
    const isTenant = contract.tenant.userId === userId;

    if (!isLandlord && !isTenant)
      throw new UnauthorizedException('Not authorized');

    const targetStatus = isLandlord
      ? ContractStatus.DRAFT
      : ContractStatus.CANCELLED;

    return this.prisma.$transaction(async (tx) => {
      await tx.room.update({
        where: { id: contract.roomId },
        data: { status: RoomStatus.AVAILABLE },
      });

      const updated = await tx.contract.update({
        where: { id: contractId },
        data: { status: targetStatus },
      });
      return updated;
    });
  }

  async requestChanges(contractId: string, tenantId: string, reason: string) {
    return this.prisma.$transaction(async (tx) => {
      const contract = await this.findOne(contractId);
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

    const paymentRef = `HD${contract.contractNumber}`
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase();
    const depositDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const updated = await this.prisma.contract.update({
      where: { id: contractId },
      data: {
        status: ContractStatus.DEPOSIT_PENDING,
        paymentRef,
        depositDeadline,
      },
      include: { tenant: { include: { user: true } } },
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
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: { room: true, landlord: true },
    });
    if (!contract) throw new NotFoundException('Contract not found');

    if (contract.status === ContractStatus.ACTIVE)
      return { success: true, status: ContractStatus.ACTIVE };
    if (contract.status !== ('DEPOSIT_PENDING' as ContractStatus))
      return { success: false, status: contract.status };

    const expectedAmount = Number(contract.deposit);
    const paymentResult = await this.paymentService.verifyPayment(
      contract,
      expectedAmount,
    );

    if (paymentResult.success) {
      await this.prisma.$transaction(async (tx) => {
        await tx.contract.update({
          where: { id },
          data: { status: ContractStatus.ACTIVE, depositDeadline: null },
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

        const invoice = await tx.invoice.create({
          data: {
            contractId: contract.id,
            tenantId: contract.tenantId,
            invoiceNumber: `INV-${contract.contractNumber}-DEP`,
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
        });

        const paymentRecord = await tx.payment.create({
          data: {
            amount: contract.deposit,
            paymentMethod: 'BANK_TRANSFER',
            paymentDate: new Date(),
            status: 'COMPLETED',
            invoiceId: invoice.id,
            tenantId: contract.tenantId,
            paidAt: new Date(),
          },
        });

        // Snapshots (Simplified)
        try {
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
        } catch (e) {
          this.logger.error('Snapshot error', e);
        }

        try {
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
        } catch (e) {
          this.logger.error('Snapshot error', e);
        }
      });
      return { success: true, status: ContractStatus.ACTIVE };
    }
    return { success: false, status: contract.status };
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

  async terminate(
    id: string,
    userId: string,
    terminateDto: TerminateContractDto,
  ) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        tenant: { include: { user: true } },
        room: {
          include: {
            property: { include: { landlord: { include: { user: true } } } },
          },
        },
      },
    });

    if (!contract) throw new NotFoundException('Contract not found');
    const isTenant = contract.tenant.userId === userId;
    const isLandlord = contract.room.property.landlord.userId === userId;

    if (!isTenant && !isLandlord) {
      /* Admin check - typically implicit or handled by guard */
    }

    const deposit = Number(contract.deposit);
    let totalDeductions = 0;
    const deductionItems: any[] = [];

    const now = new Date();
    const endDate = new Date(contract.endDate);
    const daysRemaining = Math.ceil(
      (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    const isEarlyTermination = daysRemaining > 0;

    let penalty = 0;
    let refundAmount = 0;

    if (isEarlyTermination) {
      if (isTenant) {
        // RULE: Tenant terminates early -> Penalty = 100% Deposit
        penalty = deposit;
        refundAmount = 0;
      } else {
        // RULE: Landlord terminates early -> Penalty = 200% Deposit
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
      refundAmount = Math.max(0, deposit - totalDeductions);
    }

    // Logic for deducting specific items from user input even if tenant?
    // User logic said: "Tenant cannot self-deduct. Ignore terminateDto.deductions"
    // So logic above is correct.

    await this.prisma.contract.update({
      where: { id },
      data: {
        status: ContractStatus.TERMINATED,
        terminatedAt: new Date(terminateDto.terminationDate),
        terminationDetails: {
          reason: terminateDto.reason,
          terminatedBy: userId,
          noticeDays: terminateDto.noticeDays,
          deductions: deductionItems,
          refundAmount: refundAmount,
          totalDeductions: totalDeductions,
          depositReturned: terminateDto.returnDeposit,
        },
      } as any,
    });

    await this.prisma.room.update({
      where: { id: contract.roomId },
      data: { status: RoomStatus.AVAILABLE },
    });

    const roomInfo = `P.${contract.room.roomNumber} - ${contract.room.property.name}`;
    const landlordUser = contract.room.property.landlord.user;

    try {
      if (isTenant) {
        await this.notificationsService.create({
          userId: landlordUser.id,
          title: `📢 Hợp đồng chấm dứt bởi người thuê - ${roomInfo}`,
          content: `Lý do: ${terminateDto.reason}\nHoàn trả cọc dự kiến: ${refundAmount.toLocaleString('vi-VN')} VNĐ`,
          notificationType: NotificationType.CONTRACT,
          relatedEntityId: id,
        });
      } else {
        await this.notificationsService.create({
          userId: contract.tenant.userId,
          title: `⚠️ Hợp đồng đã được chấm dứt - ${roomInfo}`,
          content: `Lý do: ${terminateDto.reason}\nHoàn trả cọc: ${refundAmount.toLocaleString('vi-VN')} VNĐ\nKhấu trừ: ${totalDeductions.toLocaleString('vi-VN')} VNĐ`,
          notificationType: NotificationType.CONTRACT,
          relatedEntityId: id,
        });
      }
    } catch (error) {
      this.logger.warn(`Failed to send notifications: ${error}`);
    }

    return {
      message: 'Contract terminated successfully',
      contractId: id,
      financials: {
        deposit: deposit,
        deductions: totalDeductions,
        refundAmount: refundAmount,
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
      include: { tenant: true },
    });
    if (!contract) throw new NotFoundException('Contract not found');

    const currentChecklist = (contract as any).handoverChecklist || {
      checkIn: null,
      checkOut: null,
    };

    if (dto.stage === HandoverStage.CHECK_IN) {
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
