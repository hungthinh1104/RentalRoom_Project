import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import {
  CreateServiceDto,
  UpdateServiceDto,
  FilterServicesDto,
  ServiceResponseDto,
} from './dto';
import { PaginatedResponse } from 'src/shared/dtos';
import { plainToClass } from 'class-transformer';
import { User, UserRole } from '@prisma/client';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createServiceDto: CreateServiceDto) {
    const service = await this.prisma.service.create({
      data: createServiceDto,
    });

    // convert Decimal trước khi transform
    const safeService = {
      ...service,
      unitPrice: service.unitPrice ? Number(service.unitPrice) : 0,
    };

    return plainToClass(ServiceResponseDto, safeService, {
      excludeExtraneousValues: true,
    });
  }

  async findAll(filterDto: FilterServicesDto) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'serviceName',
      sortOrder = 'desc',
      propertyId,
      serviceType,
      billingMethod,
      search,
    } = filterDto;

    const where: any = {};

    if (propertyId) where.propertyId = propertyId;
    if (serviceType) where.serviceType = serviceType;
    if (billingMethod) where.billingMethod = billingMethod;
    if (search) {
      where.OR = [
        { serviceName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [services, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
        skip: filterDto.skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { property: true },
      }),
      this.prisma.service.count({ where }),
    ]);

    // ✅ convert Decimal -> number trước khi transform
    const safeServices = services.map((s) => ({
      ...s,
      unitPrice: s.unitPrice ? Number(s.unitPrice) : 0,
    }));

    const transformed = safeServices.map((service) =>
      plainToClass(ServiceResponseDto, service, {
        excludeExtraneousValues: true,
      }),
    );

    return new PaginatedResponse(transformed, total, page, limit);
  }

  async findOne(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: { property: true },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    const safeService = {
      ...service,
      unitPrice: service.unitPrice ? Number(service.unitPrice) : 0,
    };

    return plainToClass(ServiceResponseDto, safeService, {
      excludeExtraneousValues: true,
    });
  }

  async update(id: string, updateServiceDto: UpdateServiceDto, user: User) {
    const existing = await this.prisma.service.findUnique({
      where: { id },
      include: { property: true },
    });

    if (!existing) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    // 🔒 SECURITY: Landlord can only update services for their properties
    if (
      user.role === UserRole.LANDLORD &&
      existing.property.landlordId !== user.id
    ) {
      throw new BadRequestException(
        'Landlords can only update services for their own properties',
      );
    }

    const service = await this.prisma.service.update({
      where: { id },
      data: updateServiceDto,
      include: { property: true },
    });

    const safeService = {
      ...service,
      unitPrice: service.unitPrice ? Number(service.unitPrice) : 0,
    };

    return plainToClass(ServiceResponseDto, safeService, {
      excludeExtraneousValues: true,
    });
  }

  async remove(id: string, user: User) {
    const existing = await this.prisma.service.findUnique({
      where: { id },
      include: { property: true },
    });

    if (!existing) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    // 🔒 SECURITY: Landlord can only delete services for their properties
    if (
      user.role === UserRole.LANDLORD &&
      existing.property.landlordId !== user.id
    ) {
      throw new BadRequestException(
        'Landlords can only delete services for their own properties',
      );
    }

    await this.prisma.service.delete({
      where: { id },
    });

    return { message: 'Service deleted successfully' };
  }
}
