import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import {
  CreateNotificationDto,
  UpdateNotificationDto,
  FilterNotificationsDto,
  NotificationResponseDto,
} from './dto';
import { PaginatedResponse } from 'src/shared/dtos';
import { plainToClass } from 'class-transformer';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: createDto,
    });

    return plainToClass(NotificationResponseDto, notification, {
      excludeExtraneousValues: true,
    });
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
