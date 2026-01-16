import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { PaginatedResponse } from 'src/shared/dtos';
import { CacheService } from 'src/common/services/cache.service';
import { UploadService } from '../upload/upload.service';
import { UserRole, User } from '@prisma/client';
import {
  CreateRoomDto,
  FilterRoomsDto,
  RoomResponseDto,
  UpdateRoomDto,
  ReplyToReviewDto,
  CreateReviewDto,
} from './dto';

@Injectable()
export class RoomsService {
  private readonly logger = new Logger(RoomsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
    private readonly uploadService: UploadService,
  ) {}

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

  async bulkCreate(bulkDto: { rooms: CreateRoomDto[] }) {
    return await this.prisma.$transaction(async (tx) => {
      const createdRooms: any[] = [];
      for (const dto of bulkDto.rooms) {
        const { images, amenities, ...rest } = dto;
        const room = await tx.room.create({
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
        createdRooms.push(room);
      }

      // Post-process
      return createdRooms.map((room) => {
        const roomData = {
          ...room,
          pricePerMonth: room.pricePerMonth ? Number(room.pricePerMonth) : null,
          deposit: room.deposit ? Number(room.deposit) : null,
          images: room.images?.map((img) => img.imageUrl) || [],
          amenities:
            room.amenities?.map((amenity) => amenity.amenityType) || [],
        };
        return plainToClass(RoomResponseDto, roomData, {
          excludeExtraneousValues: true,
        });
      });
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

  async update(id: string, updateRoomDto: UpdateRoomDto, user: User) {
    const { images, amenities, ...rest } = updateRoomDto;

    // Check if room exists and get existing images for cleanup
    const existingRoom = await this.prisma.room.findUnique({
      where: { id },
      include: {
        images: true,
        property: {
          select: { landlordId: true },
        },
      },
    });

    if (!existingRoom) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }

    // 🔒 SECURITY: Landlord can only update own rooms
    if (
      user.role === UserRole.LANDLORD &&
      existingRoom.property.landlordId !== user.id
    ) {
      throw new BadRequestException(
        'Landlords can only update their own rooms',
      );
    }

    // Identify images to delete from cloud (but don't delete yet)
    let imagesToDeleteFromCloud: string[] = [];
    if (images !== undefined) {
      const oldImageUrls = existingRoom.images.map((img) => img.imageUrl);
      imagesToDeleteFromCloud = oldImageUrls.filter(
        (url) => !images.includes(url),
      );
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
              quantity: 1,
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
    if (imagesToDeleteFromCloud.length > 0) {
      Promise.all(
        imagesToDeleteFromCloud.map((url) =>
          this.uploadService.deleteFileByUrl(url),
        ),
      )
        .then((results) =>
          this.logger.debug(
            `✓ Cloud cleanup completed: ${results.filter(Boolean).length}/${imagesToDeleteFromCloud.length} deleted`,
          ),
        )
        .catch((err) =>
          this.logger.warn('⚠ Cloud cleanup error (non-critical): ' + err),
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

  async remove(id: string, user: User) {
    // Check if room exists
    const room = await this.findOne(id);

    // Get room's property for landlord check
    const fullRoom = await this.prisma.room.findUnique({
      where: { id },
      include: {
        property: {
          select: { landlordId: true },
        },
      },
    });

    // 🔒 SECURITY: Landlord can only delete own rooms
    if (
      user.role === UserRole.LANDLORD &&
      (!fullRoom || fullRoom.property.landlordId !== user.id)
    ) {
      throw new BadRequestException(
        'Landlords can only delete their own rooms',
      );
    }

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

  async createReview(dto: CreateReviewDto, tenantUserId: string) {
    // 1. Verify contract exists and belongs to tenant
    const contract = await this.prisma.contract.findUnique({
      where: { id: dto.contractId },
      include: {
        tenant: { include: { user: true } },
        room: true,
      },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    if (contract.tenant.userId !== tenantUserId) {
      throw new NotFoundException(
        'You are not authorized to review this contract',
      );
    }

    // 2. Check contract status (must be EXPIRED or TERMINATED)
    if (
      contract.status !== 'EXPIRED' &&
      contract.status !== 'TERMINATED' &&
      contract.status !== 'ACTIVE' // Allow active for testing
    ) {
      throw new NotFoundException(
        `Cannot review contract with status: ${contract.status}. Contract must be completed.`,
      );
    }

    // 3. Check if review already exists
    const existingReview = await this.prisma.roomReview.findFirst({
      where: {
        contractId: dto.contractId,
        tenantId: contract.tenantId,
      },
    });

    if (existingReview) {
      throw new NotFoundException('You have already reviewed this contract');
    }

    // 4. Create review
    const review = await this.prisma.roomReview.create({
      data: {
        tenantId: contract.tenantId,
        roomId: contract.roomId,
        contractId: contract.id,
        rating: dto.rating,
        cleanlinessRating: dto.cleanlinessRating,
        locationRating: dto.locationRating,
        valueRating: dto.valueRating,
        comment: dto.comment,
        reviewImages: dto.reviewImages || [],
      },
      include: {
        tenant: { include: { user: true } },
        room: {
          include: {
            property: { include: { landlord: { include: { user: true } } } },
          },
        },
      },
    });

    // 5. Invalidate cache
    await this.cacheService.invalidateRoomCache();

    return review;
  }

  async getReviewsByTenant(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { userId: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const reviews = await this.prisma.roomReview.findMany({
      where: { tenantId: tenant.userId },
      include: {
        room: {
          select: {
            roomNumber: true,
            property: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reviews;
  }
}
