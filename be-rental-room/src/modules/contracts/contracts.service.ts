import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
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

@Injectable()
export class ContractsService {
  private readonly logger = new Logger(ContractsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
  ) {}

  // Rental Applications
  async createApplication(createDto: CreateRentalApplicationDto) {
    const application = await this.prisma.rentalApplication.create({
      data: createDto,
    });

    // Trigger notification + email to landlord (best effort)
    try {
      // Fetch related data
      const [tenant, room] = await Promise.all([
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

      if (!tenant || !room) {
        throw new Error('Failed to fetch tenant or room data');
      }

      const landlord = room.property.landlord.user;
      const tenantUser = tenant.user;

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
    await this.findOneApplication(id);

    const updated = await this.prisma.rentalApplication.update({
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

    const tenantUser = updated.tenant.user;
    const landlordUser = updated.room.property.landlord.user;

    try {
      // Notify tenant
      await this.notificationsService.create({
        userId: tenantUser.id,
        title: `Đơn thuê đã được duyệt - Phòng ${updated.room.roomNumber}`,
        content: `Chủ nhà ${landlordUser.fullName} đã duyệt đơn của bạn. Liên hệ: ${landlordUser.email}${landlordUser.phoneNumber ? ` / ${landlordUser.phoneNumber}` : ''}`,
        notificationType: NotificationType.APPLICATION,
        relatedEntityId: updated.id,
        isRead: false,
      });

      // Email tenant
      await this.emailService.sendRentalApplicationStatusEmail(
        tenantUser.email,
        tenantUser.fullName,
        `Phòng ${updated.room.roomNumber}`,
        'ĐƯỢC DUYỆT',
        true,
        landlordUser.fullName,
        landlordUser.email,
        landlordUser.phoneNumber,
      );
    } catch (error) {
      const msg = (error as Error)?.message ?? String(error);
      this.logger.warn(
        `Failed to notify tenant for approved application ${id}: ${msg}`,
      );
    }

    return plainToClass(RentalApplicationResponseDto, updated, {
      excludeExtraneousValues: true,
    });
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
    const contract = await this.prisma.contract.create({
      data: createContractDto,
    });

    // Convert Decimal to Number
    const cleaned = {
      ...contract,
      depositAmount: contract.depositAmount
        ? Number(contract.depositAmount)
        : 0,
      monthlyRent: contract.monthlyRent ? Number(contract.monthlyRent) : 0,
    };

    return plainToClass(ContractResponseDto, cleaned, {
      excludeExtraneousValues: true,
    });
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
      where.contractNumber = { contains: search, mode: 'insensitive' };
    }

    const [contracts, total] = await Promise.all([
      this.prisma.contract.findMany({
        where,
        skip: filterDto.skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.contract.count({ where }),
    ]);

    // Convert Decimal to Number
    const cleaned = contracts.map((c) => ({
      ...c,
      depositAmount: c.depositAmount ? Number(c.depositAmount) : 0,
      monthlyRent: c.monthlyRent ? Number(c.monthlyRent) : 0,
    }));

    const transformed = cleaned.map((contract) =>
      plainToClass(ContractResponseDto, contract, {
        excludeExtraneousValues: true,
      }),
    );

    return new PaginatedResponse(transformed, total, page, limit);
  }

  async findOne(id: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
    });

    if (!contract) {
      throw new NotFoundException(`Contract with ID ${id} not found`);
    }

    // Convert Decimal to Number
    const cleaned = {
      ...contract,
      depositAmount: contract.depositAmount
        ? Number(contract.depositAmount)
        : 0,
      monthlyRent: contract.monthlyRent ? Number(contract.monthlyRent) : 0,
    };

    return plainToClass(ContractResponseDto, cleaned, {
      excludeExtraneousValues: true,
    });
  }

  async update(id: string, updateContractDto: UpdateContractDto) {
    await this.findOne(id);

    const contract = await this.prisma.contract.update({
      where: { id },
      data: updateContractDto,
    });

    // Convert Decimal to Number
    const cleaned = {
      ...contract,
      depositAmount: contract.depositAmount
        ? Number(contract.depositAmount)
        : 0,
      monthlyRent: contract.monthlyRent ? Number(contract.monthlyRent) : 0,
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
        penalty = Number(contract.depositAmount);
        penaltyReason = `Rút khỏi hợp đồng trước thời hạn (còn ${daysRemaining} ngày). Mất 100% tiền cọc theo điều khoản hợp đồng.`;

        // Even with 30 days notice, if contract not fulfilled, deposit is lost
        if (noticeDays >= requiredNoticeDays) {
          penaltyReason += ` Mặc dù đã báo trước ${noticeDays} ngày, nhưng do vi phạm cam kết thời gian thuê, tiền cọc sẽ bị giữ lại.`;
        }
      } else if (isLandlord) {
        // LANDLORD terminates early: Penalty is refund 100% deposit + 100% deposit as compensation
        penalty = Number(contract.depositAmount) * 2;
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

    // Update contract
    const updated = await this.prisma.contract.update({
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
      depositAmount: updated.depositAmount ? Number(updated.depositAmount) : 0,
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
