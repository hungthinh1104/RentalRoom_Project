import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import {
  CreateTenantDto,
  UpdateTenantDto,
  FilterTenantsDto,
  TenantResponseDto,
} from './dto';
import { PaginatedResponse } from 'src/shared/dtos';
import { plainToClass } from 'class-transformer';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createTenantDto: CreateTenantDto) {
    const tenant = await this.prisma.tenant.create({
      data: createTenantDto,
    });

    return plainToClass(TenantResponseDto, tenant, {
      excludeExtraneousValues: true,
    });
  }

  async findAll(filterDto: FilterTenantsDto) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      userId,
      search,
    } = filterDto;

    const where: any = {};

    if (userId) where.userId = userId;
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search, mode: 'insensitive' } },
        { citizenId: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [tenants, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        skip: filterDto.skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { user: true },
      }),
      this.prisma.tenant.count({ where }),
    ]);

    const transformedTenants = tenants.map((tenant) =>
      plainToClass(
        TenantResponseDto,
        {
          ...tenant,
          fullName: tenant.user?.fullName,
          email: tenant.user?.email,
          phoneNumber: tenant.user?.phoneNumber,
        },
        {
          excludeExtraneousValues: true,
        },
      ),
    );

    return new PaginatedResponse(transformedTenants, total, page, limit);
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { userId: id },
      include: { user: true },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    return plainToClass(
      TenantResponseDto,
      {
        ...tenant,
        fullName: tenant.user?.fullName,
        email: tenant.user?.email,
        phoneNumber: tenant.user?.phoneNumber,
      },
      {
        excludeExtraneousValues: true,
      },
    );
  }

  async update(id: string, updateTenantDto: UpdateTenantDto) {
    await this.findOne(id); // Check existence

    // Logic: If sensitive info (citizenId) changes, reset KYC status
    const updateData: any = { ...updateTenantDto };
    if (updateTenantDto.citizenId) {
      updateData.isVerified = false;
    }

    const tenant = await this.prisma.tenant.update({
      where: { userId: id },
      data: updateData,
    });

    return plainToClass(TenantResponseDto, tenant, {
      excludeExtraneousValues: true,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Check existence

    await this.prisma.tenant.delete({
      where: { userId: id },
    });

    return { message: 'Tenant deleted successfully' };
  }
}
