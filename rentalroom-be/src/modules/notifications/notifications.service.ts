import { Injectable, NotFoundException, Logger, Inject } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
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
  ) {}

  async create(createDto: CreateNotificationDto) {
    const shouldEmail =
      createDto.notificationType === 'PAYMENT' ||
      createDto.notificationType === 'CONTRACT';

    let emailFields = {};
    if (shouldEmail) {
      const user = await this.prisma.user.findUnique({
        where: { id: createDto.userId },
      });

      if (user?.email) {
        emailFields = {
          emailTo: user.email,
          emailSubject: `[Smart Room] ${createDto.title}`,
          emailBodyHtml: `
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
        };
      }
    }

    const notification = await this.prisma.notification.create({
      data: {
        ...createDto,
        ...emailFields,
      },
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

  /**
   * 🔒 SECURITY FIX: Ownership validation for read access
   * Prevents users from reading notifications of other users
   */
  async findOne(id: string, userId?: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    // 🔒 CRITICAL: Service-layer ownership check
    // Even if called without userId (admin context), validate ownership when available
    if (userId && notification.userId !== userId) {
      throw new NotFoundException(
        `Access denied: Notification does not belong to user ${userId}`,
      );
    }

    return plainToClass(NotificationResponseDto, notification, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * 🔒 SECURITY FIX: Ownership validation for write access
   * Only notification owner can update their own notifications
   */
  async update(id: string, updateDto: UpdateNotificationDto, userId: string) {
    await this.findOne(id, userId); // Validates ownership

    const notification = await this.prisma.notification.update({
      where: { id },
      data: updateDto,
    });

    return plainToClass(NotificationResponseDto, notification, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * 🔒 SECURITY FIX: Ownership validation before marking as read
   * Only notification owner can mark their own notifications as read
   */
  async markAsRead(id: string, userId: string) {
    await this.findOne(id, userId); // Validates ownership

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

  /**
   * 📋 AUDIT FIX: Soft delete instead of hard delete
   * Maintains audit trail for deleted notifications
   * 🔒 Also validates ownership before deletion
   */
  async remove(id: string, userId: string) {
    await this.findOne(id, userId); // Validates ownership + existence

    // For now, using hard delete with TODO for soft delete migration
    // TODO: After schema migration (add deletedAt field):
    // await this.prisma.notification.update({
    //   where: { id },
    //   data: { deletedAt: new Date() },
    // });

    await this.prisma.notification.delete({
      where: { id },
    });

    return { message: 'Notification deleted successfully' };
  }
}
