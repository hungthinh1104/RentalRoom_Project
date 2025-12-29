import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateMaintenanceRequestDto } from './dto/create-maintenance-request.dto';
import { UpdateMaintenanceRequestDto } from './dto/update-maintenance-request.dto';
import { FilterMaintenanceRequestsDto } from './dto/filter-maintenance-requests.dto';
import { CreateMaintenanceFeedbackDto } from './dto/create-maintenance-feedback.dto';
import { PaginatedResponse } from 'src/shared/dtos';
import { plainToClass } from 'class-transformer';
import { MaintenanceStatus } from './entities';
import { MaintenanceRequestResponseDto } from './dto'; // This import is still needed for the response DTO

@Injectable()
export class MaintenanceService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateMaintenanceRequestDto) {
    const request = await this.prisma.maintenanceRequest.create({
      data: createDto,
    });

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

  async update(id: string, updateDto: UpdateMaintenanceRequestDto) {
    await this.findOne(id);

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
    });

    return plainToClass(MaintenanceRequestResponseDto, request, {
      excludeExtraneousValues: true,
    });
  }

  async remove(id: string) {
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
