import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import {
  CreatePropertyDto,
  UpdatePropertyDto,
  FilterPropertiesDto,
  PropertyResponseDto,
} from './dto';
import { PaginatedResponse } from 'src/shared/dtos';
import { plainToClass } from 'class-transformer';
import { CacheService } from 'src/common/services/cache.service';

@Injectable()
export class PropertiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  async create(createPropertyDto: CreatePropertyDto) {
    const property = await this.prisma.property.create({
      data: createPropertyDto,
    });

    return plainToClass(PropertyResponseDto, property, {
      excludeExtraneousValues: true,
    });
  }

  async findAll(filterDto: FilterPropertiesDto) {
    const {
      page: pageParam = 1,
      limit: limitParam = 10,
      sortBy = 'id',
      sortOrder = 'desc',
      landlordId,
      propertyType,
      city,
      ward,
      search,
    } = filterDto;

    // Convert to numbers
    const page = Number(pageParam);
    const limit = Number(limitParam);

    const where: any = {};

    if (landlordId) where.landlordId = landlordId;
    if (propertyType) where.propertyType = propertyType;
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (ward) where.ward = { contains: ward, mode: 'insensitive' };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [properties, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        skip: filterDto.skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          rooms: true,
          _count: {
            select: { rooms: true },
          },
        },
      }),
      this.prisma.property.count({ where }),
    ]);

    const transformedProperties = properties.map((property) =>
      plainToClass(
        PropertyResponseDto,
        {
          ...property,
          totalRooms: property._count.rooms,
          rooms: property.rooms?.map((r) => ({
            ...r,
            pricePerMonth: r.pricePerMonth ? Number(r.pricePerMonth) : 0,
            deposit: r.deposit ? Number(r.deposit) : 0,
          })),
        },
        { excludeExtraneousValues: true },
      ),
    );

    return new PaginatedResponse(transformedProperties, total, page, limit);
  }

  async findOne(id: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: {
        rooms: true,
        _count: {
          select: { rooms: true },
        },
      },
    });

    if (!property) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    return plainToClass(
      PropertyResponseDto,
      {
        ...property,
        totalRooms: property._count.rooms,
        rooms: property.rooms?.map((r) => ({
          ...r,
          pricePerMonth: r.pricePerMonth ? Number(r.pricePerMonth) : 0,
          deposit: r.deposit ? Number(r.deposit) : 0,
        })),
      },
      { excludeExtraneousValues: true },
    );
  }

  async update(id: string, updatePropertyDto: UpdatePropertyDto) {
    await this.findOne(id); // Check existence

    const property = await this.prisma.property.update({
      where: { id },
      data: updatePropertyDto,
    });

    // Invalidate cache
    await this.cacheService.invalidatePropertyCache(id);
    await this.cacheService.invalidateRoomCache(); // Some property info is in room list

    return plainToClass(PropertyResponseDto, property, {
      excludeExtraneousValues: true,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Check existence

    await this.prisma.property.delete({
      where: { id },
    });

    // Invalidate cache
    await this.cacheService.invalidatePropertyCache(id);
    await this.cacheService.invalidateRoomCache();

    return { message: 'Property deleted successfully' };
  }
}
