import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { InvoiceStatus } from '@prisma/client';
import {
  CreateRentalApplicationDto,
  CreateContractDto,
  UpdateContractDto,
  FilterRentalApplicationsDto,
  FilterContractsDto,
  RentalApplicationResponseDto,
  ContractResponseDto,
} from './dto';
import { PaginatedResponse } from 'src/shared/dtos';
import { plainToClass } from 'class-transformer';
import { ApplicationStatus, ContractStatus } from './entities';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from 'src/common/services/email.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { SepayService } from '../payments/sepay.service';
import { RoomStatus } from '@prisma/client';
import { User } from '../users/entities';

@Injectable()
export class ContractsService {
  private readonly logger = new Logger(ContractsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
    private readonly sepayService: SepayService,
  ) { }

  /**
   * Validate contract status transitions to prevent invalid state changes
   * @throws BadRequestException if transition is invalid
   */
  private validateStatusTransition(
    oldStatus: ContractStatus,
    newStatus: ContractStatus,
  ): void {
    const VALID_TRANSITIONS: Record<ContractStatus, ContractStatus[]> = {
      [ContractStatus.DRAFT]: [ContractStatus.PENDING_SIGNATURE, ContractStatus.CANCELLED],
      [ContractStatus.PENDING_SIGNATURE]: [ContractStatus.DEPOSIT_PENDING, ContractStatus.CANCELLED],
      [ContractStatus.DEPOSIT_PENDING]: [ContractStatus.ACTIVE, ContractStatus.CANCELLED, ContractStatus.EXPIRED],
      [ContractStatus.ACTIVE]: [ContractStatus.TERMINATED, ContractStatus.EXPIRED],
      [ContractStatus.TERMINATED]: [], // Terminal state
      [ContractStatus.EXPIRED]: [], // Terminal state
      [ContractStatus.CANCELLED]: [], // Terminal state
    };

    const allowedTransitions = VALID_TRANSITIONS[oldStatus];

    if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition: ${oldStatus} → ${newStatus}. ` +
        `Allowed transitions from ${oldStatus}: ${allowedTransitions?.join(', ') || 'none'}`,
      );
    }
  }

  /**
   * Auto-generate unique contract number with transaction safety
   * Format: HD-{landlordPrefix}-{YYYYMM}-{XXXX}
   * @param landlordId Landlord ID
   * @returns Unique contract number
   */
  private async generateContractNumber(landlordId: string): Promise<string> {
    const landlordPrefix = landlordId.slice(0, 4).toUpperCase();
    const date = new Date();
    const yearMonth = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;

    // Use transaction to ensure atomicity and prevent race conditions
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
      {
        maxWait: 5000, // Wait up to 5s for transaction lock
        timeout: 10000, // Transaction timeout 10s
      },
    );
  }

  // Rental Applications
  async createApplication(createDto: CreateRentalApplicationDto, user: User) {
    // 1. Ensure Tenant Profile Exists (Auto-create if missing)
    // This allows Landlords/Admins to apply for rooms without manual setup
    let tenant = await this.prisma.tenant.findUnique({
      where: { userId: user.id },
    });

    if (!tenant) {
      this.logger.log(`Auto-creating Tenant profile for user ${user.id}`);
      tenant = await this.prisma.tenant.create({
        data: { userId: user.id },
      });
    }

    // Workaround: If landlordId not provided, fetch from room's property
    let landlordId = createDto.landlordId;

    if (!landlordId) {
      const room = await this.prisma.room.findUnique({
        where: { id: createDto.roomId },
        include: { property: { select: { landlordId: true } } },
      });

      if (!room) {
        throw new NotFoundException(`Room with ID ${createDto.roomId} not found`);
      }

      if (!room.property?.landlordId) {
        throw new BadRequestException(
          'Property does not have a landlord assigned. Please contact support.',
        );
      }

      landlordId = room.property.landlordId;
      this.logger.log(`Auto-fetched landlordId ${landlordId} for room ${createDto.roomId}`);
    }

    const application = await this.prisma.rentalApplication.create({
      data: {
        ...createDto,
        tenantId: tenant.userId, // Force tenantId to be the authenticated user
        landlordId, // Use fetched or provided landlordId
      },
    });

    // Trigger notification + email to landlord (best effort)
    try {
      // Fetch related data
      const [tenantRef, room] = await Promise.all([
        this.prisma.tenant.findUnique({
          where: { userId: application.tenantId },
          include: { user: true },
        }),
        this.prisma.room.findUnique({
          where: { id: application.roomId },
          include: {
            property: {
              include: {
                landlord: { include: { user: true } },
              },
            },
          },
        }),
      ]);

      if (!tenantRef || !room) {
        throw new Error('Failed to fetch tenant or room data');
      }

      const landlord = room.property.landlord.user;
      const tenantUser = tenantRef.user;

      // Create in-app notification for landlord
      await this.notificationsService.create({
        userId: landlord.id,
        title: `Đơn Đăng Ký Thuê Mới - Phòng ${room.roomNumber}`,
        content: `${tenantUser.fullName} đã đăng ký thuê phòng "${room.roomNumber}" của bạn.`,
        notificationType: NotificationType.APPLICATION,
        relatedEntityId: application.id,
        isRead: false,
      });

      // Send email notification to landlord
      await this.emailService.sendRentalApplicationNotification(
        landlord.email,
        landlord.fullName,
        `Phòng ${room.roomNumber}`,
        room.property.address,
        Number(room.pricePerMonth),
        tenantUser.fullName,
        tenantUser.email,
        tenantUser.phoneNumber || 'N/A',
        application.requestedMoveInDate
          ? new Date(application.requestedMoveInDate).toLocaleDateString(
            'vi-VN',
          )
          : undefined,
        application.message || undefined,
      );

      this.logger.log(
        `Notification + Email triggered for landlord ${landlord.id} after rental application ${application.id}`,
      );
    } catch (error: unknown) {
      const msg = (error as Error)?.message ?? String(error);
      this.logger.warn(
        `Failed to trigger notification/email for rental application ${application.id}: ${msg}`,
      );
      // Don't throw - the application was created successfully, notification is optional
    }

    return plainToClass(RentalApplicationResponseDto, application, {
      excludeExtraneousValues: true,
    });
  }

  async findAllApplications(filterDto: FilterRentalApplicationsDto) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'applicationDate',
      sortOrder = 'desc',
      tenantId,
      landlordId,
      roomId,
      status,
      search,
    } = filterDto;

    const where: any = {};

    if (tenantId) where.tenantId = tenantId;
    if (landlordId) where.landlordId = landlordId;
    if (roomId) where.roomId = roomId;
    if (status) where.status = status;
    if (search) {
      where.message = { contains: search, mode: 'insensitive' };
    }

    const [applications, total] = await Promise.all([
      this.prisma.rentalApplication.findMany({
        where,
        skip: filterDto.skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          tenant: { include: { user: true } },
          room: { include: { property: true } },
        },
      }),
      this.prisma.rentalApplication.count({ where }),
    ]);

    const transformed = applications.map((app) =>
      plainToClass(
        RentalApplicationResponseDto,
        {
          ...app,
          tenantName: app.tenant?.user.fullName,
          tenantEmail: app.tenant?.user.email,
          tenantPhone: app.tenant?.user.phoneNumber,
          roomNumber: app.room?.roomNumber,
          roomAddress: app.room?.property.address,
        },
        {
          excludeExtraneousValues: true,
        },
      ),
    );

    return new PaginatedResponse(transformed, total, page, limit);
  }

  async findOneApplication(id: string) {
    const application = await this.prisma.rentalApplication.findUnique({
      where: { id },
      include: {
        tenant: { include: { user: true } },
        room: { include: { property: true } },
      },
    });

    if (!application) {
      throw new NotFoundException(`Rental application with ID ${id} not found`);
    }

    return plainToClass(
      RentalApplicationResponseDto,
      {
        ...application,
        tenantName: application.tenant?.user.fullName,
        tenantEmail: application.tenant?.user.email,
        tenantPhone: application.tenant?.user.phoneNumber,
        roomNumber: application.room?.roomNumber,
        roomAddress: application.room?.property.address,
      },
      {
        excludeExtraneousValues: true,
      },
    );
  }

  async approveApplication(id: string) {
    const application = await this.findOneApplication(id);

    // Update application status and create contract in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Approve application
      const app = await tx.rentalApplication.update({
        where: { id },
        data: {
          status: ApplicationStatus.APPROVED,
          reviewedAt: new Date(),
        },
        include: {
          tenant: { include: { user: true } },
          room: {
            include: {
              property: {
                include: { landlord: { include: { user: true } } },
              },
            },
          },
        },
      });

      // 2. Set room to RESERVED (prevent new applications)
      await tx.room.update({
        where: { id: application.roomId },
        data: { status: RoomStatus.RESERVED },
      });

      // 3. ✅ AUTO-CREATE CONTRACT (DRAFT status)
      const contractNumber = await this.generateContractNumber(application.landlordId);
      const startDate = app.requestedMoveInDate
        ? new Date(app.requestedMoveInDate)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      const endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 1); // 1 year lease

      const contract = await tx.contract.create({
        data: {
          applicationId: app.id,
          roomId: application.roomId,
          tenantId: application.tenantId,
          landlordId: application.landlordId,
          contractNumber,
          startDate,
          endDate,
          monthlyRent: app.room.pricePerMonth,
          deposit: app.room.deposit,
          status: ContractStatus.DRAFT,
          signedAt: new Date(),
          terms: `1. TRÁCH NHIỆM BÊN A (CHỦ NHÀ):
- Bàn giao phòng và trang thiết bị cho Bên B đúng thời hạn.
- Đảm bảo quyền sử dụng riêng rẽ và trọn vẹn của Bên B đối với phòng thuê.
- Sửa chữa kịp thời các hư hỏng do lỗi kết cấu xây dựng hoặc hao mòn tự nhiên.

2. TRÁCH NHIỆM BÊN B (NGƯỜI THUÊ):
- Thanh toán tiền thuê và tiền điện, nước đúng hạn quy định.
- Sử dụng phòng đúng mục đích, không chứa chất cấm, chất gây nổ.
- Giữ gìn vệ sinh chung, trật tự an ninh trong khu vực.
- Tự bảo quản tài sản cá nhân.
- Không được tự ý sửa chữa, cải tạo phòng khi chưa có sự đồng ý của Bên A.

3. ĐIỀU KHOẢN CHUNG:
- Hai bên cam kết thực hiện đúng các điều khoản đã ghi trong hợp đồng.
- Mọi thay đổi phải được thỏa thuận và lập thành văn bản.
- Hợp đồng có giá trị kể từ ngày ký đến ngày kết thúc thời hạn thuê.`,
        },
      });

      return { app, contract };
    });

    const tenantUser = result.app.tenant.user;
    const landlordUser = result.app.room.property.landlord.user;

    try {
      // Notify tenant about CONTRACT (not just approval)
      await this.notificationsService.create({
        userId: tenantUser.id,
        title: `Hợp đồng đã được tạo - ${result.contract.contractNumber}`,
        content: `Chủ nhà ${landlordUser.fullName} đã tạo hợp đồng cho phòng ${result.app.room.roomNumber}. Vui lòng xem xét và phê duyệt hợp đồng.`,
        notificationType: NotificationType.CONTRACT,
        relatedEntityId: result.contract.id,
        isRead: false,
      });

      // Email tenant about contract
      await this.emailService.sendRentalApplicationStatusEmail(
        tenantUser.email,
        tenantUser.fullName,
        `Phòng ${result.app.room.roomNumber}`,
        'HỢP ĐỒNG ĐÃ ĐƯỢC TẠO',
        true,
        landlordUser.fullName,
        landlordUser.email,
        landlordUser.phoneNumber,
      );
    } catch (error) {
      const msg = (error as Error)?.message ?? String(error);
      this.logger.warn(
        `Failed to notify tenant for contract ${result.contract.id}: ${msg}`,
      );
    }

    return {
      application: plainToClass(RentalApplicationResponseDto, result.app, {
        excludeExtraneousValues: true,
      }),
      contract: result.contract,
    };
  }

  async rejectApplication(id: string) {
    await this.findOneApplication(id);

    const updated = await this.prisma.rentalApplication.update({
      where: { id },
      data: {
        status: ApplicationStatus.REJECTED,
        reviewedAt: new Date(),
      },
      include: {
        tenant: { include: { user: true } },
        room: {
          include: {
            property: {
              include: { landlord: { include: { user: true } } },
            },
          },
        },
      },
    });

    const tenantUser = updated.tenant.user;
    const landlordUser = updated.room.property.landlord.user;

    try {
      await this.notificationsService.create({
        userId: tenantUser.id,
        title: `Đơn thuê bị từ chối - Phòng ${updated.room.roomNumber}`,
        content: `Chủ nhà ${landlordUser.fullName} đã từ chối đơn đăng ký của bạn. Vui lòng tìm phòng khác.`,
        notificationType: NotificationType.APPLICATION,
        relatedEntityId: updated.id,
        isRead: false,
      });

      await this.emailService.sendRentalApplicationStatusEmail(
        tenantUser.email,
        tenantUser.fullName,
        `Phòng ${updated.room.roomNumber}`,
        'BỊ TỪ CHỐI',
        false,
        landlordUser.fullName,
        landlordUser.email,
        landlordUser.phoneNumber,
      );
    } catch (error) {
      const msg = (error as Error)?.message ?? String(error);
      this.logger.warn(
        `Failed to notify tenant for rejected application ${id}: ${msg}`,
      );
    }

    return plainToClass(RentalApplicationResponseDto, updated, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Landlord sends contract to tenant for approval (With Transaction & Lock)
   */
  async sendContract(contractId: string, landlordUserId: string) {
    // 1. Fetch Contract first (outside transaction to check ownership)
    const contract = await this.findOne(contractId);

    if (contract.landlord.userId !== landlordUserId) {
      throw new UnauthorizedException('You are not authorized to send this contract');
    }

    if (contract.status !== ContractStatus.DRAFT) {
      throw new BadRequestException(
        `Contract must be in DRAFT status to send. Current status: ${contract.status}`,
      );
    }

    if (!contract.terms || contract.terms.trim().length === 0) {
      throw new BadRequestException('Contract must have terms before sending.');
    }

    // 2. Start Transaction
    return this.prisma.$transaction(async (tx) => {
      // 3. Check Room Status (Locking)
      const room = await tx.room.findUnique({
        where: { id: contract.roomId },
      });

      if (!room) throw new NotFoundException('Room not found');

      // Allow if Room is AVAILABLE or RESERVED (for this contract)
      if (room.status !== RoomStatus.AVAILABLE && room.status !== RoomStatus.RESERVED) {
        throw new BadRequestException(
          `Room is currently ${room.status}. Cannot send contract.`,
        );
      }

      // 4. Update Room -> RESERVED
      await tx.room.update({
        where: { id: contract.roomId },
        data: { status: RoomStatus.RESERVED },
      });

      // 5. Update Contract -> PENDING_SIGNATURE
      const updatedContract = await tx.contract.update({
        where: { id: contractId },
        data: {
          status: ContractStatus.PENDING_SIGNATURE,
        },
        include: {
          tenant: { include: { user: true } },
          landlord: { include: { user: true } },
          room: true,
        },
      });

      // 6. Notify Tenant (Side effect - can be outside tx, but inside is fine for now)
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
        this.logger.warn(`Failed to notify tenant for contract send ${contractId}`, error);
      }

      return updatedContract;
    });
  }

  /**
   * Landlord revokes OR Tenant rejects a pending contract
   * - Landlord -> DRAFT (Revoke to edit)
   * - Tenant -> CANCELLED (Reject terms)
   */
  async revokeContract(contractId: string, userId: string) {
    const contract = await this.findOne(contractId);

    const isLandlord = contract.landlord.userId === userId;
    const isTenant = contract.tenant.userId === userId;

    if (!isLandlord && !isTenant) {
      throw new UnauthorizedException('Not authorized');
    }

    if (contract.status !== ContractStatus.PENDING_SIGNATURE && contract.status !== ContractStatus.DEPOSIT_PENDING) {
      throw new BadRequestException('Can only revoke/reject contracts pending signature or deposit');
    }

    const targetStatus = isLandlord ? ContractStatus.DRAFT : ContractStatus.CANCELLED;

    return this.prisma.$transaction(async (tx) => {
      // Unlock Room
      await tx.room.update({
        where: { id: contract.roomId },
        data: { status: RoomStatus.AVAILABLE },
      });

      // Update Contract Status
      const updated = await tx.contract.update({
        where: { id: contractId },
        data: { status: targetStatus },
        include: {
          landlord: { include: { user: true } },
          tenant: { include: { user: true } },
        },
      });

      // Notifications
      if (isTenant) {
        // Notify Landlord about rejection
        await this.notificationsService.create({
          userId: contract.landlordId,
          title: `Hợp đồng bị từ chối - ${contract.contractNumber}`,
          content: `Khách thuê ${contract.tenant?.user?.fullName} đã từ chối ký hợp đồng. Phòng đã được mở lại.`,
          notificationType: NotificationType.CONTRACT,
          relatedEntityId: contractId,
          isRead: false,
        });
      }

      return updated;
    });
  }

  /**
   * Tenant requests changes (Negotiation)
   */
  async requestChanges(contractId: string, tenantId: string, reason: string) {
    const contract = await this.findOne(contractId);

    if (contract.tenantId !== tenantId) { // Check tenantId (Profile ID or User ID? findOne returns relations, tenantId is UserID in schema relation logic usually... wait, schema says tenantId references Tenant.userId. So this comparison depends on what tenantId param is passed. Usually UserID.)
      // Let's verify: application passes User ID. findOne joins tenant.
      // Contract.tenantId => Tenant Profile ID (actually Tenant.userId is the relation key in schema).
      // In schema: tenant Tenant @relation(fields: [tenantId], references: [userId])
      // So contract.tenantId IS the UserID of the tenant.
      // My comparison: if (contract.tenantId !== tenantId) is correct if tenantId param is UserID.
      if (contract.tenantId !== tenantId) {
        throw new UnauthorizedException('Not authorized');
      }
    }

    if (contract.status !== ContractStatus.PENDING_SIGNATURE) {
      throw new BadRequestException('Can only request changes for pending contracts');
    }

    return this.prisma.$transaction(async (tx) => {
      // Unlock Room
      await tx.room.update({
        where: { id: contract.roomId },
        data: { status: RoomStatus.AVAILABLE },
      });

      // Revert Contract & Save Note
      const updated = await tx.contract.update({
        where: { id: contractId },
        data: {
          status: ContractStatus.DRAFT,
          lastNegotiationNote: reason,
        },
        include: { landlord: { include: { user: true } } },
      });

      // Notify Landlord
      try {
        await this.notificationsService.create({
          userId: updated.landlord.userId,
          title: `Khách thuê yêu cầu sửa hợp đồng - ${updated.contractNumber}`,
          content: `Lý do: ${reason}`,
          notificationType: NotificationType.CONTRACT,
          relatedEntityId: contractId,
          isRead: false,
        });
      } catch (e) { }

      return updated;
    });
  }

  /**
   * Tenant approves contract - Two-party agreement flow
   */
  async tenantApproveContract(contractId: string, tenantId: string) {
    const contract = await this.findOne(contractId);

    // Verify tenant owns this contract
    if (contract.tenantId !== tenantId) {
      throw new UnauthorizedException('You are not authorized to approve this contract');
    }

    // Verify contract status
    if (contract.status !== ContractStatus.PENDING_SIGNATURE) {
      throw new BadRequestException(
        `Contract must be in PENDING_SIGNATURE status to approve. Current status: ${contract.status}`,
      );
    }

    // Generate Payment Ref & Deadline
    const paymentRef = `HD${contract.contractNumber}`.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const depositDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    // Update contract to DEPOSIT_PENDING
    const updated = await this.prisma.contract.update({
      where: { id: contractId },
      data: {
        status: ContractStatus.DEPOSIT_PENDING,
        paymentRef,
        depositDeadline,
        // tenantSignedAt: new Date(),
      },
      include: {
        tenant: { include: { user: true } },
        landlord: { include: { user: true } },
        room: true,
      },
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
      this.logger.warn(`Failed to notify landlord for contract approval ${contractId}`, error);
    }

    return updated;
  }

  async withdrawApplication(id: string, tenantUserId: string) {
    // Fetch the raw application to check ownership
    const application = await this.prisma.rentalApplication.findUnique({
      where: { id },
      include: { tenant: true },
    });

    if (!application) {
      throw new NotFoundException(`Rental application with ID ${id} not found`);
    }

    // Verify that the application belongs to the current tenant
    if (application.tenant.userId !== tenantUserId) {
      throw new UnauthorizedException(
        'You can only withdraw your own application',
      );
    }

    // Check if application is still pending (can only withdraw pending applications)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
    if (application.status !== ApplicationStatus.PENDING) {
      throw new BadRequestException(
        'You can only withdraw pending applications',
      );
    }

    const updated = await this.prisma.rentalApplication.update({
      where: { id },
      data: {
        status: ApplicationStatus.WITHDRAWN,
        reviewedAt: new Date(),
      },
      include: {
        tenant: { include: { user: true } },
        room: {
          include: {
            property: {
              include: { landlord: { include: { user: true } } },
            },
          },
        },
      },
    });

    const tenantUser = updated.tenant.user;
    const landlordUser = updated.room.property.landlord.user;

    try {
      await this.notificationsService.create({
        userId: tenantUser.id,
        title: `Đơn thuê đã được rút - Phòng ${updated.room.roomNumber}`,
        content: `Bạn đã rút đơn thuê phòng ${updated.room.roomNumber}.`,
        notificationType: NotificationType.APPLICATION,
        relatedEntityId: updated.id,
        isRead: false,
      });

      await this.notificationsService.create({
        userId: landlordUser.id,
        title: `Đơn thuê đã được rút - Phòng ${updated.room.roomNumber}`,
        content: `Khách hàng ${tenantUser.fullName} đã rút đơn thuê phòng ${updated.room.roomNumber}.`,
        notificationType: NotificationType.APPLICATION,
        relatedEntityId: updated.id,
        isRead: false,
      });
    } catch (error) {
      const msg = (error as Error)?.message ?? String(error);
      this.logger.warn(
        `Failed to notify for withdrawn application ${id}: ${msg}`,
      );
    }

    return plainToClass(RentalApplicationResponseDto, updated, {
      excludeExtraneousValues: true,
    });
  }

  // Contracts
  async create(createContractDto: CreateContractDto) {
    // 1. Check Payment Config (Strict Mode)
    // @ts-ignore
    const paymentConfig = await this.prisma.paymentConfig.findUnique({
      where: { landlordId: createContractDto.landlordId },
    });

    if (!paymentConfig || !paymentConfig.isActive || !paymentConfig.apiToken) {
      throw new BadRequestException(
        'Vui lòng cấu hình tài khoản nhận tiền (SePay) trước khi tạo hợp đồng.',
      );
    }

    const { residents, ...contractData } = createContractDto;

    // 2. Auto-generate contract number if not provided
    const contractNumber = contractData.contractNumber ||
      await this.generateContractNumber(createContractDto.landlordId);

    const paymentRef = contractNumber.replace(/[^a-zA-Z0-9]/g, '').toUpperCase(); // Sanitize
    const depositDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    // 3. Create Contract + Soft Lock Room (Transaction)
    // Note: Room is currently AVAILABLE. We change to RESERVED.
    const contract = await this.prisma.$transaction(async (tx) => {
      // Check room availability again in transaction
      const room = await tx.room.findUnique({ where: { id: contractData.roomId } });
      if (room?.status !== RoomStatus.AVAILABLE) {
        throw new BadRequestException('Phòng không còn trống.');
      }

      // Create Contract
      const newContract = await tx.contract.create({
        data: {
          ...contractData,
          applicationId: contractData.applicationId!, // Ensure not undefined
          contractNumber, // Use auto-generated or provided number
          // @ts-ignore
          status: ContractStatus.DEPOSIT_PENDING as any,
          // @ts-ignore
          paymentRef,
          // @ts-ignore
          depositDeadline,
          residents:
            residents && residents.length > 0
              ? { create: residents }
              : undefined,
        },
        include: {
          residents: true,
        },
      });

      // Soft Lock Room
      await tx.room.update({
        where: { id: contractData.roomId },
        data: { status: RoomStatus.RESERVED },
      });

      return newContract;
    });

    // 4. Send email with payment instructions
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { userId: createContractDto.tenantId },
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
              <li><strong>Hạn thanh toán:</strong> ${depositDeadline.toLocaleString('vi-VN')}</li>
            </ul>
            <p>Vui lòng chuyển khoản với nội dung: <strong>${paymentRef}</strong></p>
            <p>Sau khi thanh toán, hợp đồng sẽ tự động được kích hoạt.</p>
          `,
        );
      }
    } catch (error) {
      this.logger.warn(`Failed to send payment email for contract ${contract.id}`, error);
    }

    // Convert Decimal to Number
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

  /**
   * Check payment status (Polling endpoint)
   */
  async verifyPaymentStatus(id: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        room: true,
        landlord: true, // Needed for SePay config
      }
    });

    if (!contract) throw new NotFoundException('Contract not found');

    // If already active, return success
    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
    if (contract.status === ContractStatus.ACTIVE) {
      return { success: true, status: ContractStatus.ACTIVE };
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
    if (contract.status !== 'DEPOSIT_PENDING' as ContractStatus) {
      return { success: false, status: contract.status };
    }

    // Call SePay Service
    const expectedAmount = Number(contract.deposit);
    const isPaid = await this.sepayService.verifyPayment(contract, expectedAmount);

    if (isPaid) {
      // Activate contract and sync application status
      await this.prisma.$transaction(async (tx) => {
        // 1. Activate contract
        await tx.contract.update({
          where: { id },
          data: { status: ContractStatus.ACTIVE, depositDeadline: null },
        });

        // 2. Set room to OCCUPIED
        await tx.room.update({
          where: { id: contract.roomId },
          data: { status: RoomStatus.OCCUPIED },
        });

        // 3. Sync application status to COMPLETED (if from application)
        if (contract.applicationId) {
          await tx.rentalApplication.update({
            where: { id: contract.applicationId },
            data: {
              status: ApplicationStatus.COMPLETED,
              contractId: contract.id,
            },
          });

          // 4. Auto-reject other PENDING applications for same room
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

        // 5. Create Invoice for Deposit (Required for Payment FK)
        const invoice = await tx.invoice.create({
          data: {
            contractId: contract.id,
            tenantId: contract.tenantId,
            invoiceNumber: `INV-${contract.contractNumber}-DEP`,
            issueDate: new Date(),
            dueDate: new Date(), // Same day payment
            totalAmount: contract.deposit,
            status: InvoiceStatus.PAID,
            paidAt: new Date(),
            // Optional: Create Line Item for detail
            lineItems: {
              create: {
                itemType: 'OTHER',
                description: 'Tiền cọc hợp đồng (Deposit)',
                quantity: 1,
                unitPrice: contract.deposit,
                amount: contract.deposit,
              }
            }
          }
        });

        // 6. Record payment linked to Invoice
        await tx.payment.create({
          data: {
            amount: contract.deposit,
            paymentMethod: 'BANK_TRANSFER',
            paymentDate: new Date(),
            status: 'COMPLETED',
            invoiceId: invoice.id, // Link to the newly created invoice
            tenantId: contract.tenantId,
            paidAt: new Date(),
            // transactionId? Maybe from SePay but we don't have it here easily unless passed.
            // But this function is just 'verifyPaymentStatus', generic.
          },
        });
      });

      // 6. Send activation email to tenant
      try {
        const tenant = await this.prisma.tenant.findUnique({
          where: { userId: contract.tenantId },
          include: { user: true },
        });

        if (tenant) {
          await this.emailService.sendEmail(
            tenant.user.email,
            `Hợp đồng ${contract.contractNumber} đã được kích hoạt`,
            `
              <h2>Thanh toán thành công!</h2>
              <p>Xin chào ${tenant.user.fullName},</p>
              <p>Hợp đồng <strong>${contract.contractNumber}</strong> đã được kích hoạt.</p>
              <p>Cảm ơn bạn đã thanh toán tiền cọc. Hợp đồng của bạn hiện đang có hiệu lực.</p>
              <p>Chúc bạn có trải nghiệm thuê phòng tốt đẹp!</p>
            `,
          );
        }
      } catch (error) {
        this.logger.warn(`Failed to send activation email for contract ${id}`, error);
      }

      return { success: true, status: ContractStatus.ACTIVE };
    }

    return { success: false, status: ContractStatus.DEPOSIT_PENDING };
  }

  async findAll(filterDto: FilterContractsDto) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'startDate',
      sortOrder = 'desc',
      tenantId,
      landlordId,
      roomId,
      status,
      search,
    } = filterDto;

    const where: any = {};

    if (tenantId) where.tenantId = tenantId;
    if (landlordId) where.landlordId = landlordId;
    if (roomId) where.roomId = roomId;
    if (status) where.status = status;
    if (search) {
      where.contractNumber = { contains: search };
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
          room: true,
          residents: true,
        },
      }),
      this.prisma.contract.count({ where }),
    ]);

    const transformed = contracts.map((contract) => ({
      ...contract,
      deposit: Number(contract.deposit),
      monthlyRent: Number(contract.monthlyRent),
      earlyTerminationPenalty: contract.earlyTerminationPenalty
        ? Number(contract.earlyTerminationPenalty)
        : 0,
      tenantName: contract.tenant.user.fullName,
      tenantEmail: contract.tenant.user.email,
      landlordName: contract.landlord.user.fullName,
      roomNumber: contract.room.roomNumber,
      residents: contract.residents || [],
    }));

    return new PaginatedResponse(
      plainToClass(ContractResponseDto, transformed, {
        excludeExtraneousValues: true,
      }),
      total,
      page,
      limit,
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

    // Debug log
    if (contract) {
      console.log('[ContractsService] findOne raw:', JSON.stringify({
        id: contract.id,
        hasRoom: !!contract.room,
        hasProperty: !!contract.room?.property,
        deposit: contract.deposit,
        depositType: typeof contract.deposit
      }, null, 2));
    }

    if (!contract) {
      throw new NotFoundException(`Contract with ID ${id} not found`);
    }

    const cleaned = {
      ...contract,
      ...contract,
      deposit: contract.deposit ? Number(contract.deposit) : 0,
      monthlyRent: contract.monthlyRent ? Number(contract.monthlyRent) : 0,
      earlyTerminationPenalty: contract.earlyTerminationPenalty
        ? Number(contract.earlyTerminationPenalty)
        : 0,
      tenantName: contract.tenant?.user?.fullName || 'Unknown',
      tenantEmail: contract.tenant?.user?.email || 'Unknown',
      landlordName: contract.landlord?.user?.fullName || 'Unknown',
      roomNumber: contract.room?.roomNumber || 'Unknown',
      residents: contract.residents || [],
      invoices: contract.invoices?.map(inv => ({
        ...inv,
        totalAmount: Number(inv.totalAmount)
      })) || [],
    };

    return plainToClass(ContractResponseDto, cleaned, {
      excludeExtraneousValues: true,
    });
    // return { DEBUG: true, ...cleaned } as any;
  }

  async update(id: string, updateContractDto: UpdateContractDto) {
    // Exclude immutable fields and relations that need special handling
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { tenantId, landlordId, roomId, applicationId, residents, ...updateData } = updateContractDto;

    const contract = await this.prisma.contract.update({
      where: { id },
      data: updateData,
    });

    // Convert Decimal to Number
    const cleaned = {
      ...contract,
      deposit: contract.deposit
        ? Number(contract.deposit)
        : 0,
      monthlyRent: contract.monthlyRent ? Number(contract.monthlyRent) : 0,
      earlyTerminationPenalty: contract.earlyTerminationPenalty
        ? Number(contract.earlyTerminationPenalty)
        : 0,
    };

    return plainToClass(ContractResponseDto, cleaned, {
      excludeExtraneousValues: true,
    });
  }

  async terminate(
    id: string,
    userId: string,
    terminateDto: { reason: string; noticeDays?: number },
  ) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        tenant: { include: { user: true } },
        landlord: { include: { user: true } },
        room: { include: { property: true } },
      },
    });

    if (!contract) {
      throw new NotFoundException(`Contract with ID ${id} not found`);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
    if (contract.status === ContractStatus.TERMINATED) {
      throw new BadRequestException('Contract is already terminated');
    }

    // Determine who is terminating (tenant or landlord)
    const isTenant = contract.tenant.userId === userId;
    const isLandlord = contract.landlord.userId === userId;

    if (!isTenant && !isLandlord) {
      throw new UnauthorizedException(
        'You do not have permission to terminate this contract',
      );
    }

    // Calculate penalty for early termination
    const now = new Date();
    const endDate = new Date(contract.endDate);
    const daysRemaining = Math.ceil(
      (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    const noticeDays = terminateDto.noticeDays || 0;
    const requiredNoticeDays = 30;

    let penalty = 0;
    let penaltyReason = '';

    // Early termination before contract end date
    if (daysRemaining > 0) {
      if (isTenant) {
        // TENANT terminates early: Loses 100% deposit
        penalty = Number(contract.deposit);
        penaltyReason = `Rút khỏi hợp đồng trước thời hạn (còn ${daysRemaining} ngày). Mất 100% tiền cọc theo điều khoản hợp đồng.`;

        // Even with 30 days notice, if contract not fulfilled, deposit is lost
        if (noticeDays >= requiredNoticeDays) {
          penaltyReason += ` Mặc dù đã báo trước ${noticeDays} ngày, nhưng do vi phạm cam kết thời gian thuê, tiền cọc sẽ bị giữ lại.`;
        }
      } else if (isLandlord) {
        // LANDLORD terminates early: Penalty is refund 100% deposit + 100% deposit as compensation
        penalty = Number(contract.deposit) * 2;
        penaltyReason = `Chủ nhà chấm dứt hợp đồng trước thời hạn (còn ${daysRemaining} ngày). Phải hoàn trả 100% tiền cọc + đền bù thêm 100% tiền cọc cho người thuê.`;

        if (noticeDays < requiredNoticeDays) {
          penaltyReason += ` Không báo trước đủ ${requiredNoticeDays} ngày (chỉ báo ${noticeDays} ngày).`;
        }
      }
    } else {
      // Contract ended naturally or after end date
      penaltyReason =
        'Hợp đồng kết thúc đúng hạn hoặc đã hết hạn. Không có phạt.';
    }

    // Transactional Update
    const updated = await this.prisma.$transaction(async (tx) => {
      // 1. Update Contract
      const contractUpdated = await tx.contract.update({
        where: { id },
        data: {
          status: ContractStatus.TERMINATED,
          terminatedAt: new Date(),
          terminationReason: terminateDto.reason,
          terminatedByUserId: userId,
          earlyTerminationPenalty: penalty,
          noticeDays: noticeDays,
          terminationApproved: true,
        },
        include: {
          tenant: { include: { user: true } },
          landlord: { include: { user: true } },
          room: { include: { property: true } },
        },
      });

      // 2. Unlock Room
      await tx.room.update({
        where: { id: contractUpdated.roomId },
        data: { status: RoomStatus.AVAILABLE },
      });

      return contractUpdated;
    });

    const tenantUser = updated.tenant.user;
    const landlordUser = updated.landlord.user;
    const roomInfo = `Phòng ${updated.room.roomNumber} - ${updated.room.property.name}`;

    // Send notifications to both parties
    try {
      if (isTenant) {
        // Notify tenant
        await this.notificationsService.create({
          userId: tenantUser.id,
          title: `⚠️ Hợp đồng đã chấm dứt - ${roomInfo}`,
          content: `Bạn đã chấm dứt hợp đồng thuê.\n\n📋 Lý do: ${terminateDto.reason}\n\n💰 Xử lý tiền cọc:\n${penaltyReason}\n\nSố tiền: ${penalty.toLocaleString('vi-VN')} VNĐ`,
          notificationType: NotificationType.CONTRACT,
          relatedEntityId: updated.id,
          isRead: false,
        });

        // Notify landlord
        await this.notificationsService.create({
          userId: landlordUser.id,
          title: `📢 Người thuê đã chấm dứt hợp đồng - ${roomInfo}`,
          content: `Khách hàng ${tenantUser.fullName} đã chấm dứt hợp đồng.\n\n📋 Lý do: ${terminateDto.reason}\n⏰ Báo trước: ${noticeDays} ngày\n\n💰 Xử lý tiền cọc:\n${penaltyReason}\n\nSố tiền: ${penalty.toLocaleString('vi-VN')} VNĐ`,
          notificationType: NotificationType.CONTRACT,
          relatedEntityId: updated.id,
          isRead: false,
        });

        // Send email to tenant
        await this.emailService.sendEmail(
          tenantUser.email,
          '⚠️ Xác nhận chấm dứt hợp đồng thuê',
          `<h2>Hợp đồng ${updated.contractNumber} đã được chấm dứt</h2>
             <p><strong>Phòng:</strong> ${roomInfo}</p>
             <p><strong>Lý do:</strong> ${terminateDto.reason}</p>
             <p><strong>Ngày chấm dứt:</strong> ${new Date().toLocaleDateString('vi-VN')}</p>
             <hr>
             <h3>💰 Xử lý tiền cọc:</h3>
             <p>${penaltyReason}</p>
             <p><strong>Số tiền:</strong> ${penalty.toLocaleString('vi-VN')} VNĐ</p>
             <hr>
             <p>Vui lòng liên hệ chủ nhà để hoàn tất thủ tục bàn giao phòng.</p>
             <p><strong>Chủ nhà:</strong> ${landlordUser.fullName}</p>
             <p><strong>Điện thoại:</strong> ${landlordUser.phoneNumber}</p>`,
        );
      } else {
        // Landlord terminated
        await this.notificationsService.create({
          userId: landlordUser.id,
          title: `⚠️ Đã chấm dứt hợp đồng - ${roomInfo}`,
          content: `Bạn đã chấm dứt hợp đồng thuê.\n\n📋 Lý do: ${terminateDto.reason}\n\n💰 Xử lý tiền cọc và bồi thường:\n${penaltyReason}\n\nTổng số tiền phải trả: ${penalty.toLocaleString('vi-VN')} VNĐ`,
          notificationType: NotificationType.CONTRACT,
          relatedEntityId: updated.id,
          isRead: false,
        });

        await this.notificationsService.create({
          userId: tenantUser.id,
          title: `📢 Chủ nhà đã chấm dứt hợp đồng - ${roomInfo}`,
          content: `Chủ nhà ${landlordUser.fullName} đã chấm dứt hợp đồng.\n\n📋 Lý do: ${terminateDto.reason}\n⏰ Báo trước: ${noticeDays} ngày\n\n💰 Bồi thường:\n${penaltyReason}\n\nSố tiền bạn nhận được: ${penalty.toLocaleString('vi-VN')} VNĐ`,
          notificationType: NotificationType.CONTRACT,
          relatedEntityId: updated.id,
          isRead: false,
        });

        await this.emailService.sendEmail(
          tenantUser.email,
          '📢 Thông báo chấm dứt hợp đồng thuê',
          `<h2>Hợp đồng ${updated.contractNumber} đã được chủ nhà chấm dứt</h2>
             <p><strong>Phòng:</strong> ${roomInfo}</p>
             <p><strong>Lý do:</strong> ${terminateDto.reason}</p>
             <p><strong>Ngày chấm dứt:</strong> ${new Date().toLocaleDateString('vi-VN')}</p>
             <hr>
             <h3>💰 Bồi thường:</h3>
             <p>${penaltyReason}</p>
             <p><strong>Số tiền bạn nhận được:</strong> ${penalty.toLocaleString('vi-VN')} VNĐ</p>
             <hr>
             <p>Vui lòng liên hệ chủ nhà để hoàn tất thủ tục.</p>
             <p><strong>Chủ nhà:</strong> ${landlordUser.fullName}</p>
             <p><strong>Điện thoại:</strong> ${landlordUser.phoneNumber}</p>`,
        );
      }
    } catch (error) {
      const msg = (error as Error)?.message ?? String(error);
      this.logger.warn(`Failed to send termination notifications: ${msg}`);
    }

    // Convert Decimal to Number
    const cleaned = {
      ...updated,
      deposit: updated.deposit ? Number(updated.deposit) : 0,
      monthlyRent: updated.monthlyRent ? Number(updated.monthlyRent) : 0,
      earlyTerminationPenalty: updated.earlyTerminationPenalty
        ? Number(updated.earlyTerminationPenalty)
        : 0,
    };

    return plainToClass(ContractResponseDto, cleaned, {
      excludeExtraneousValues: true,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.contract.delete({
      where: { id },
    });

    return { message: 'Contract deleted successfully' };
  }
}
