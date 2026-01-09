import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateMaintenanceRequestDto,
  UpdateMaintenanceRequestDto,
  FilterMaintenanceRequestsDto,
  MaintenanceRequestResponseDto,
  CreateMaintenanceFeedbackDto,
} from './dto';
import { PaginatedResponse } from 'src/shared/dtos';
import { plainToClass } from 'class-transformer';
import { MaintenanceStatus } from './entities';
import { NotificationType, User, UserRole } from '@prisma/client';

@Injectable()
export class MaintenanceService {
  private readonly logger = new Logger(MaintenanceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) { }

  async create(createDto: CreateMaintenanceRequestDto) {
    const request = await this.prisma.maintenanceRequest.create({
      data: createDto,
      include: {
        room: {
          include: {
            property: {
              include: {
                landlord: true,
              },
            },
          },
        },
        tenant: true,
      },
    });

    // 🔔 TRIGGER NOTIFICATION: Maintenance Request Submitted
    try {
      await this.notificationsService.create({
        userId: request.room.property.landlordId,
        title: '🔧 Yêu cầu bảo trì mới',
        content: `Yêu cầu bảo trì mới cho phòng ${request.room.roomNumber}: ${request.title}`,
        notificationType: 'MAINTENANCE' as any,
        relatedEntityId: request.id,
      });
      this.logger.log(`📬 Maintenance notification sent to landlord ${request.room.property.landlordId}`);
    } catch (error) {
      this.logger.error('Failed to send maintenance notification', error);
    }

    return plainToClass(MaintenanceRequestResponseDto, request, {
      excludeExtraneousValues: true,
    });
  }

  async findAll(filterDto: FilterMaintenanceRequestsDto) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'requestDate',
      sortOrder = 'desc',
      roomId,
      tenantId,
      landlordId,
      status,
      priority,
      search,
    } = filterDto;

    const where: any = {};

    if (roomId) where.roomId = roomId;
    if (tenantId) where.tenantId = tenantId;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (landlordId) {
      where.room = {
        property: {
          landlordId: landlordId,
        },
      };
    }
    if (priority) where.priority = priority;
    if (landlordId) {
      where.room = {
        property: {
          landlordId: landlordId,
        },
      };
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [requests, total] = await Promise.all([
      this.prisma.maintenanceRequest.findMany({
        where,
        include: landlordId
          ? {
            room: {
              include: {
                property: true,
              },
            },
          }
          : undefined,
        skip: filterDto.skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.maintenanceRequest.count({ where }),
    ]);

    const transformed = requests.map((request) =>
      plainToClass(MaintenanceRequestResponseDto, request, {
        excludeExtraneousValues: true,
      }),
    );

    return new PaginatedResponse(transformed, total, page, limit);
  }

  async findOne(id: string) {
    const request = await this.prisma.maintenanceRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException(
        `Maintenance request with ID ${id} not found`,
      );
    }

    return plainToClass(MaintenanceRequestResponseDto, request, {
      excludeExtraneousValues: true,
    });
  }

  async update(id: string, updateDto: UpdateMaintenanceRequestDto, user: User) {
    const existing = await this.prisma.maintenanceRequest.findUnique({
      where: { id },
      include: { room: { include: { property: true } } },
    });

    if (!existing) {
      throw new NotFoundException(`Maintenance request with ID ${id} not found`);
    }

    // 🔒 SECURITY: Landlord can only update requests for their properties
    if (user.role === UserRole.LANDLORD && existing.room.property.landlordId !== user.id) {
      throw new BadRequestException('Landlords can only update maintenance requests for their own properties');
    }

    const request = await this.prisma.maintenanceRequest.update({
      where: { id },
      data: updateDto,
    });

    return plainToClass(MaintenanceRequestResponseDto, request, {
      excludeExtraneousValues: true,
    });
  }

  async complete(id: string) {
    await this.findOne(id);

    const request = await this.prisma.maintenanceRequest.update({
      where: { id },
      data: {
        status: MaintenanceStatus.COMPLETED,
        completedAt: new Date(),
      },
      include: {
        tenant: true,
        room: true,
      },
    });

    // 🔔 TRIGGER NOTIFICATION: Maintenance Completed
    try {
      await this.notificationsService.create({
        userId: request.tenantId,
        title: '✅ Bảo trì hoàn tất',
        content: `Yêu cầu bảo trì "${request.title}" cho phòng ${request.room.roomNumber} đã được hoàn tất.`,
        notificationType: 'MAINTENANCE' as any,
        relatedEntityId: request.id,
      });
      this.logger.log(`📬 Maintenance completion notification sent to tenant ${request.tenantId}`);
    } catch (error) {
      this.logger.error('Failed to send completion notification', error);
    }

    return plainToClass(MaintenanceRequestResponseDto, request, {
      excludeExtraneousValues: true,
    });
  }

  async remove(id: string, user: User) {
    // Admin-only endpoint (enforced by @Auth decorator in controller)
    // No additional ownership check needed
    await this.findOne(id);

    await this.prisma.maintenanceRequest.delete({
      where: { id },
    });

    return { message: 'Maintenance request deleted successfully' };
  }

  async submitFeedback(id: string, feedbackDto: CreateMaintenanceFeedbackDto) {
    const request = await this.prisma.maintenanceRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException('Maintenance request not found');
    }

    return this.prisma.maintenanceRequest.update({
      where: { id },
      data: {
        rating: feedbackDto.rating,
        feedback: feedbackDto.feedback,
      },
    });
  }
}
