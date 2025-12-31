import { Injectable, NotFoundException } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { PaginatedResponse } from 'src/shared/dtos';
import { CacheService } from 'src/common/services/cache.service';
import { UploadService } from '../upload/upload.service';
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
    private readonly uploadService: UploadService,
  ) { }

  async create(createRoomDto: CreateRoomDto) {
    // console.log('DEBUG CREATE ROOM DTO:', createRoomDto);
    // require('fs').writeFileSync('debug_dto.json', JSON.stringify(createRoomDto, null, 2));
    const { images, amenities, ...rest } = createRoomDto;

    const room = await this.prisma.room.create({
      data: {
        ...rest,
        images: {
          create: images?.map((url, index) => ({
            imageUrl: url,
            displayOrder: index,
          })),
        },
        amenities: {
          create: amenities?.map((type) => ({
            amenityType: type,
            quantity: 1, // Default quantity
          })),
        },
      },
      include: {
        property: true,
        images: true,
        amenities: true,
      },
    });

    // Invalidate cache
    await this.cacheService.invalidateRoomCache();

    // Convert Prisma Decimal objects to numbers and map relations
    const roomData = {
      ...room,
      pricePerMonth: room.pricePerMonth ? Number(room.pricePerMonth) : null,
      deposit: room.deposit ? Number(room.deposit) : null,
      images: room.images?.map((img) => img.imageUrl) || [],
      amenities: room.amenities?.map((amenity) => amenity.amenityType) || [],
    };

    return plainToClass(RoomResponseDto, roomData, {
      excludeExtraneousValues: true,
    });
  }

  async findAll(filterDto: FilterRoomsDto, userId?: string) {
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
              landlord: {
                select: {
                  user: {
                    select: {
                      id: true,
                      fullName: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
          images: {
            orderBy: {
              displayOrder: 'asc',
            },
          },
          amenities: true,
          _count: {
            select: {
              reviews: true,
            },
          },
        },
      }),
      this.prisma.room.count({ where }),
    ]);

    // Fetch user favorites if userId is provided
    let favoriteRoomIds: Set<string> = new Set();
    if (userId) {
      const favorites = await this.prisma.favoriteRoom.findMany({
        where: { tenantId: userId },
        select: { roomId: true },
      });
      favoriteRoomIds = new Set(favorites.map((f) => f.roomId));
    }

    // Fetch review aggregations separately for better performance
    const roomIds = rooms.map((r) => r.id);
    const reviewAggregations = await this.prisma.roomReview.groupBy({
      by: ['roomId'],
      where: {
        roomId: { in: roomIds },
      },
      _avg: {
        rating: true,
      },
      _count: {
        rating: true,
      },
    });

    const reviewStatsMap = new Map(
      reviewAggregations.map((agg) => [
        agg.roomId,
        {
          averageRating: agg._avg.rating
            ? Number(agg._avg.rating.toFixed(1))
            : undefined,
          reviewCount: agg._count.rating,
        },
      ]),
    );

    const transformedRooms = rooms.map((room) => {
      const reviewStats = reviewStatsMap.get(room.id) || {
        averageRating: undefined,
        reviewCount: 0,
      };

      // Convert Prisma Decimal to number and handle null values
      const plainRoom = {
        ...room,
        pricePerMonth:
          room.pricePerMonth != null ? Number(room.pricePerMonth) : 0,
        deposit: room.deposit != null ? Number(room.deposit) : 0,
        area: room.area != null ? Number(room.area) : 0,
        maxOccupants: room.maxOccupants != null ? room.maxOccupants : 1,
        description: room.description || '',
        averageRating: reviewStats.averageRating,
        reviewCount: reviewStats.reviewCount,
        isFavorited: favoriteRoomIds.has(room.id),
        // Transform images and amenities to arrays
        images: room.images || [],
        amenities: room.amenities || [],
        _count: undefined, // Remove internal field
      };

      return plainToClass(RoomResponseDto, plainRoom, {
        excludeExtraneousValues: true,
      });
    });

    return new PaginatedResponse(transformedRooms, total, page, limit);
  }

  async findOne(id: string, userId?: string) {
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
        reviews: {
          select: {
            rating: true,
          },
        },
      },
    });

    if (!room) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }

    // Check if favorited by user
    let isFavorited = false;
    if (userId) {
      const favorite = await this.prisma.favoriteRoom.findUnique({
        where: {
          tenantId_roomId: {
            tenantId: userId,
            roomId: id,
          },
        },
      });
      isFavorited = !!favorite;
    }

    // Convert Prisma Decimal to number
    const plainRoom = {
      ...room,
      pricePerMonth: room.pricePerMonth
        ? Number(room.pricePerMonth)
        : undefined,
      deposit: room.deposit ? Number(room.deposit) : undefined,
      area: room.area ? Number(room.area) : undefined,
      isFavorited,
      images: room.images?.map((img) => img.imageUrl) || [],
      amenities: room.amenities?.map((amenity) => amenity.amenityType) || [],
    };

    return plainToClass(RoomResponseDto, plainRoom, {
      excludeExtraneousValues: true,
    });
  }

  async update(id: string, updateRoomDto: UpdateRoomDto) {
    console.log('Update room DTO received:', JSON.stringify(updateRoomDto, null, 2));
    const { images, amenities, ...rest } = updateRoomDto;
    console.log('Extracted - images:', images, 'amenities:', amenities);

    // Check if room exists and get existing images for cleanup
    const existingRoom = await this.prisma.room.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!existingRoom) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }

    // Identify images to delete from cloud (but don't delete yet)
    let imagesToDeleteFromCloud: string[] = [];
    if (images !== undefined) {
      const oldImageUrls = existingRoom.images.map((img) => img.imageUrl);
      imagesToDeleteFromCloud = oldImageUrls.filter(
        (url) => !images.includes(url),
      );

      console.log('Old images:', oldImageUrls);
      console.log('New images:', images);
      console.log('Images to delete (after DB update):', imagesToDeleteFromCloud);
    }

    // Update database FIRST
    const room = await this.prisma.room.update({
      where: { id },
      data: {
        ...rest,
        ...(images !== undefined && {
          images: {
            deleteMany: {},
            create: images.map((url, index) => ({
              imageUrl: url,
              displayOrder: index,
            })),
          },
        }),
        ...(amenities !== undefined && {
          amenities: {
            deleteMany: {},
            create: amenities.map((type) => ({
              amenityType: type,
              quantity: 1, // Default quantity
            })),
          },
        }),
      },
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

    // Invalidate cache
    await this.cacheService.invalidateRoomCache(id);
    await this.cacheService.invalidateRoomCache();

    // Delete from cloud AFTER database update succeeds (non-blocking)
    // This ensures we don't lose images if DB update fails
    if (imagesToDeleteFromCloud.length > 0) {
      // Run in background - don't wait for completion
      Promise.all(
        imagesToDeleteFromCloud.map((url) =>
          this.uploadService.deleteFileByUrl(url),
        ),
      )
        .then((results) =>
          console.log(
            `✓ Cloud cleanup completed: ${results.filter(Boolean).length}/${imagesToDeleteFromCloud.length} deleted`,
          ),
        )
        .catch((err) =>
          console.error('⚠ Cloud cleanup error (non-critical):', err),
        );
    }

    // Convert Prisma Decimal to number
    const plainRoom = {
      ...room,
      pricePerMonth: room.pricePerMonth
        ? Number(room.pricePerMonth)
        : undefined,
      deposit: room.deposit ? Number(room.deposit) : undefined,
      area: room.area ? Number(room.area) : undefined,
      images: room.images?.map((img) => img.imageUrl) || [],
      amenities: room.amenities?.map((amenity) => amenity.amenityType) || [],
    };

    return plainToClass(RoomResponseDto, plainRoom, {
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

  async getReviewsByLandlord(landlordId: string) {
    const properties = await this.prisma.property.findMany({
      where: { landlordId },
      include: {
        rooms: {
          include: {
            reviews: {
              include: {
                tenant: {
                  include: {
                    user: {
                      select: {
                        fullName: true,
                      },
                    },
                  },
                },
                room: {
                  select: {
                    roomNumber: true,
                    images: {
                      take: 1,
                      orderBy: { displayOrder: 'asc' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const reviews = (properties as any).flatMap((p: any) =>
      p.rooms.flatMap((r: any) => r.reviews),
    );

    return {
      data: reviews,
      total: reviews.length,
    };
  }
}
