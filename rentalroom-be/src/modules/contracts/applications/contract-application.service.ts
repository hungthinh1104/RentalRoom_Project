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
  FilterRentalApplicationsDto,
  RentalApplicationResponseDto,
} from '../dto';
import { PaginatedResponse } from 'src/shared/dtos';
import { plainToClass } from 'class-transformer';
import { ApplicationStatus, ContractStatus } from '../entities';
import { NotificationsService } from '../../notifications/notifications.service';
import { EmailService } from 'src/common/services/email.service';
import { NotificationType } from '../../notifications/entities/notification.entity';
import { RoomStatus } from '../../rooms/entities/room.entity';
import { User } from '../../users/entities';

@Injectable()
export class ContractApplicationService {
  private readonly logger = new Logger(ContractApplicationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Auto-generate unique contract number with transaction safety
   * Format: HD-{landlordPrefix}-{YYYYMM}-{XXXX}
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

  async createApplication(createDto: CreateRentalApplicationDto, user: User) {
    let tenant = await this.prisma.tenant.findUnique({
      where: { userId: user.id },
    });

    if (!tenant) {
      this.logger.log(`Auto-creating Tenant profile for user ${user.id}`);
      tenant = await this.prisma.tenant.create({
        data: { userId: user.id },
      });
    }

    let landlordId = createDto.landlordId;

    if (!landlordId) {
      const room = await this.prisma.room.findUnique({
        where: { id: createDto.roomId },
        include: { property: { select: { landlordId: true } } },
      });

      if (!room) {
        throw new NotFoundException(
          `Room with ID ${createDto.roomId} not found`,
        );
      }

      if (!room.property?.landlordId) {
        throw new BadRequestException(
          'Property does not have a landlord assigned.',
        );
      }

      landlordId = room.property.landlordId;
    }

    return await this.prisma
      .$transaction(
        async (tx) => {
          const room = await tx.$queryRaw<
            Array<{ id: string; status: string }>
          >`
          SELECT id, status FROM "room"
          WHERE id = ${createDto.roomId}::uuid
          FOR UPDATE
        `;

          if (!room || room.length === 0) {
            throw new NotFoundException(
              `Room with ID ${createDto.roomId} not found`,
            );
          }

          if (room[0].status !== RoomStatus.AVAILABLE) {
            throw new BadRequestException(
              `Room is not available (Status: ${room[0].status})`,
            );
          }

          const existingApplication = await tx.rentalApplication.findFirst({
            where: {
              roomId: createDto.roomId,
              status: { in: ['PENDING', 'APPROVED'] },
            },
          });

          if (existingApplication) {
            throw new BadRequestException(
              'This room already has a pending or approved application',
            );
          }

          const application = await tx.rentalApplication.create({
            data: {
              ...createDto,
              tenantId: tenant.userId,
              landlordId,
            },
          });

          await tx.room.update({
            where: { id: createDto.roomId },
            data: { status: RoomStatus.DEPOSIT_PENDING as any },
          });

          return application;
        },
        { maxWait: 5000, timeout: 10000 },
      )
      .then(async (application) => {
        try {
          const [tenantRef, room] = await Promise.all([
            this.prisma.tenant.findUnique({
              where: { userId: application.tenantId },
              include: { user: true },
            }),
            this.prisma.room.findUnique({
              where: { id: application.roomId },
              include: {
                property: {
                  include: { landlord: { include: { user: true } } },
                },
              },
            }),
          ]);

          if (tenantRef && room) {
            const landlord = room.property.landlord.user;
            const tenantUser = tenantRef.user;

            await this.notificationsService.create({
              userId: landlord.id,
              title: `Đơn Đăng Ký Thuê Mới - Phòng ${room.roomNumber}`,
              content: `${tenantUser.fullName} đã đăng ký thuê phòng "${room.roomNumber}" của bạn.`,
              notificationType: NotificationType.APPLICATION,
              relatedEntityId: application.id,
              isRead: false,
            });

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
          }
        } catch (error) {
          this.logger.warn(`Failed to notify landlord: ${error}`);
        }

        return plainToClass(RentalApplicationResponseDto, application, {
          excludeExtraneousValues: true,
        });
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
        { excludeExtraneousValues: true },
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
      { excludeExtraneousValues: true },
    );
  }

  async approveApplication(id: string) {
    const application = await this.findOneApplication(id);

    const result = await this.prisma.$transaction(async (tx) => {
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

      await tx.room.update({
        where: { id: application.roomId },
        data: { status: RoomStatus.DEPOSIT_PENDING as any },
      });

      const contractNumber = await this.generateContractNumber(
        application.landlordId,
      );
      const startDate = app.requestedMoveInDate
        ? new Date(app.requestedMoveInDate)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 1);

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
      await this.notificationsService.create({
        userId: tenantUser.id,
        title: `Hợp đồng đã được tạo - ${result.contract.contractNumber}`,
        content: `Chủ nhà ${landlordUser.fullName} đã tạo hợp đồng cho phòng ${result.app.room.roomNumber}. Vui lòng xem xét và phê duyệt hợp đồng.`,
        notificationType: NotificationType.CONTRACT,
        relatedEntityId: result.contract.id,
        isRead: false,
      });

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
      this.logger.warn(`Failed to notify tenant: ${error}`);
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
            property: { include: { landlord: { include: { user: true } } } },
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
      this.logger.warn(`Failed to notify tenant: ${error}`);
    }

    return plainToClass(RentalApplicationResponseDto, updated, {
      excludeExtraneousValues: true,
    });
  }

  async withdrawApplication(id: string, tenantUserId: string) {
    const application = await this.prisma.rentalApplication.findUnique({
      where: { id },
      include: { tenant: true },
    });

    if (!application) {
      throw new NotFoundException(`Rental application with ID ${id} not found`);
    }

    if (application.tenant.userId !== tenantUserId) {
      throw new UnauthorizedException(
        'You can only withdraw your own application',
      );
    }

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
            property: { include: { landlord: { include: { user: true } } } },
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
}
