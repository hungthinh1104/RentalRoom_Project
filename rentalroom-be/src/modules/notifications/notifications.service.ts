import { Injectable, NotFoundException, Logger, Inject } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { EmailService } from 'src/common/services/email.service';
import {
  CreateNotificationDto,
  UpdateNotificationDto,
  FilterNotificationsDto,
  NotificationResponseDto,
} from './dto';
import { PaginatedResponse } from 'src/shared/dtos';
import { plainToClass } from 'class-transformer';
import { NotificationsGateway } from './gateways';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject('NOTIFICATIONS_GATEWAY')
    private readonly notificationsGateway: NotificationsGateway,
    private readonly emailService: EmailService,
  ) {}

  async create(createDto: CreateNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: createDto,
    });

    const result = plainToClass(NotificationResponseDto, notification, {
      excludeExtraneousValues: true,
    });

    // 1. Emit real-time notification via WebSocket
    try {
      this.notificationsGateway.notifyUser(createDto.userId, notification);
      this.logger.debug(
        `📬 Real-time notification emitted for user ${createDto.userId}`,
      );
    } catch (error) {
      this.logger.debug(
        `WebSocket notification failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    // 2. Send Email Notification (Critical for Debt/Payment)
    if (
      createDto.notificationType === 'PAYMENT' ||
      createDto.notificationType === 'CONTRACT'
    ) {
      try {
        const user = await this.prisma.user.findUnique({
          where: { id: createDto.userId },
        });

        if (user && user.email) {
          await this.emailService.sendEmail(
            user.email,
            `[Smart Room] ${createDto.title}`, // Subject
            `
              <h2>${createDto.title}</h2>
              <p>${createDto.content}</p>
              <br/>
              <a href="${process.env.FRONTEND_URL}/dashboard/tenant/payments" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                Xem chi tiết / Thanh toán
              </a>
              <p style="font-size: 12px; color: grey; margin-top: 20px;">
                Bạn nhận được email này vì bạn là thành viên của hệ thống Smart Room.
              </p>
            `,
          );
          this.logger.log(
            `📧 Email sent to ${user.email} for ${createDto.notificationType}`,
          );
        }
      } catch (error) {
        this.logger.error(
          `Failed to send email notification for user ${createDto.userId}`,
          error,
        );
      }
    }

    return result;
  }

  async findAll(filterDto: FilterNotificationsDto) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'sentAt',
      sortOrder = 'desc',
      userId,
      notificationType,
      isRead,
      search,
    } = filterDto;

    const where: any = {};

    if (userId) where.userId = userId;
    if (notificationType) where.notificationType = notificationType;
    if (isRead !== undefined) where.isRead = isRead;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip: filterDto.skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.notification.count({ where }),
    ]);

    const transformed = notifications.map((notification) =>
      plainToClass(NotificationResponseDto, notification, {
        excludeExtraneousValues: true,
      }),
    );

    return new PaginatedResponse(transformed, total, page, limit);
  }

  async findOne(id: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    return plainToClass(NotificationResponseDto, notification, {
      excludeExtraneousValues: true,
    });
  }

  async update(id: string, updateDto: UpdateNotificationDto) {
    await this.findOne(id);

    const notification = await this.prisma.notification.update({
      where: { id },
      data: updateDto,
    });

    return plainToClass(NotificationResponseDto, notification, {
      excludeExtraneousValues: true,
    });
  }

  async markAsRead(id: string) {
    await this.findOne(id);

    const notification = await this.prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return plainToClass(NotificationResponseDto, notification, {
      excludeExtraneousValues: true,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.notification.delete({
      where: { id },
    });

    return { message: 'Notification deleted successfully' };
  }
}
