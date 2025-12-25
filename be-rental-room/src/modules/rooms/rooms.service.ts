import { Injectable, NotFoundException } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { PaginatedResponse } from 'src/shared/dtos';
import { CacheService } from 'src/common/services/cache.service';
import {
  CreateRoomDto,
  FilterRoomsDto,
  RoomResponseDto,
  UpdateRoomDto,
  ReplyToReviewDto,
} from './dto';

@Injectable()
export class RoomsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) { }

  async create(createRoomDto: CreateRoomDto) {
    const room = await this.prisma.room.create({
      data: createRoomDto,
      include: {
        property: true,
      },
    });

    // Invalidate cache
    await this.cacheService.invalidateRoomCache();

    return plainToClass(RoomResponseDto, room, {
      excludeExtraneousValues: true,
    });
  }

  async findAll(filterDto: FilterRoomsDto) {
    const {
      page: pageParam = 1,
      limit: limitParam = 10,
      sortBy = 'id',
      sortOrder = 'desc',
      propertyId,
      status,
      minPrice,
      maxPrice,
      minArea,
      maxArea,
      search,
    } = filterDto;

    // Convert to numbers
    const page = Number(pageParam);
    const limit = Number(limitParam);

    // Build where clause
    const where: any = {};

    if (propertyId) {
      where.propertyId = propertyId;
    }

    if (status) {
      where.status = status;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.pricePerMonth = {};
      if (minPrice !== undefined) {
        where.pricePerMonth.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        where.pricePerMonth.lte = maxPrice;
      }
    }

    if (minArea !== undefined || maxArea !== undefined) {
      where.area = {};
      if (minArea !== undefined) {
        where.area.gte = minArea;
      }
      if (maxArea !== undefined) {
        where.area.lte = maxArea;
      }
    }

    if (search) {
      where.OR = [
        { roomNumber: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [rooms, total] = await Promise.all([
      this.prisma.room.findMany({
        where,
        skip: filterDto.skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          property: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
              ward: true,
            },
          },
        },
      }),
      this.prisma.room.count({ where }),
    ]);

    const transformedRooms = rooms.map((room) => {
      // Convert Prisma Decimal to number and handle null values
      const plainRoom = {
        ...room,
        pricePerMonth:
          room.pricePerMonth != null ? Number(room.pricePerMonth) : 0,
        deposit: room.deposit != null ? Number(room.deposit) : 0,
        area: room.area != null ? Number(room.area) : 0,
        maxOccupants: room.maxOccupants != null ? room.maxOccupants : 1,
        description: room.description || '',
      };

      return plainToClass(RoomResponseDto, plainRoom, {
        excludeExtraneousValues: true,
      });
    });

    return new PaginatedResponse(transformedRooms, total, page, limit);
  }

  async findOne(id: string) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            ward: true,
          },
        },
        images: true,
        amenities: true,
        reviews: true,
      },
    });

    if (!room) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }

    // Convert Prisma Decimal to number
    const plainRoom = {
      ...room,
      pricePerMonth: room.pricePerMonth
        ? Number(room.pricePerMonth)
        : undefined,
      deposit: room.deposit ? Number(room.deposit) : undefined,
      area: room.area ? Number(room.area) : undefined,
    };

    return plainToClass(RoomResponseDto, plainRoom, {
      excludeExtraneousValues: true,
    });
  }

  async update(id: string, updateRoomDto: UpdateRoomDto) {
    // Check if room exists
    await this.findOne(id);

    const room = await this.prisma.room.update({
      where: { id },
      data: updateRoomDto,
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            ward: true,
          },
        },
      },
    });

    // Invalidate cache for this room
    await this.cacheService.invalidateRoomCache(id);

    return plainToClass(RoomResponseDto, room, {
      excludeExtraneousValues: true,
    });
  }

  async remove(id: string) {
    // Check if room exists
    await this.findOne(id);

    await this.prisma.room.delete({
      where: { id },
    });

    // Invalidate cache for this room
    await this.cacheService.invalidateRoomCache(id);
  }

  async replyToReview(reviewId: string, dto: ReplyToReviewDto) {
    const review = await this.prisma.roomReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return this.prisma.roomReview.update({
      where: { id: reviewId },
      data: {
        landlordReply: dto.reply,
        repliedAt: new Date(),
      },
    });
  }
}
