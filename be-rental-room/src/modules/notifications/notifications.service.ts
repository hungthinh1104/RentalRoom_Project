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
    const notification = await this.prisma.notification.create({
      data: createDto,
    });

    const result = plainToClass(NotificationResponseDto, notification, {
      excludeExtraneousValues: true,
    });

    // Emit real-time notification via WebSocket
    try {
      this.notificationsGateway.notifyUser(createDto.userId, notification);
      this.logger.debug(
        `📬 Real-time notification emitted for user ${createDto.userId}`,
      );
    } catch (error) {
      // Gateway might not be available if no WebSocket connections
      // This is fine, notification is still saved in DB
      this.logger.debug(
        `WebSocket notification failed (user may be offline): ${error instanceof Error ? error.message : String(error)}`,
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
