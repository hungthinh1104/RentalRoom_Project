import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { RoomStatus } from '@prisma/client';

@Injectable()
export class RecommendationService {
    constructor(private readonly prisma: PrismaService) { }

    async getPersonalized(userId: string) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { userId },
        });

        if (!tenant) {
            // Return generic recommendations if not a tenant (or fallback)
            return this.prisma.room.findMany({
                where: { status: RoomStatus.AVAILABLE },
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
                    images: {
                        take: 1,
                        orderBy: { displayOrder: 'asc' },
                    },
                },
                take: 6,
                orderBy: { createdAt: 'desc' },
            });
        }

        const tenantId = tenant.userId;

        // 1. Get user's favorites to understand preferences
        const favorites = await this.prisma.favoriteRoom.findMany({
            where: { tenantId },
            include: {
                room: {
                    include: {
                        property: true,
                    },
                },
            },
        });

        let recommendedRooms;

        if (favorites.length > 0) {
            // Logic: Find rooms in same component (city/district) or similar price range
            const cities = [...new Set(favorites.map(f => f.room.property.city))];
            const avgPrice = favorites.reduce((sum, f) => sum + Number(f.room.pricePerMonth), 0) / favorites.length;
            const minPrice = avgPrice * 0.7;
            const maxPrice = avgPrice * 1.3;
            const favoritedRoomIds = favorites.map(f => f.roomId);

            recommendedRooms = await this.prisma.room.findMany({
                where: {
                    status: RoomStatus.AVAILABLE,
                    id: { notIn: favoritedRoomIds }, // Exclude already favorited
                    AND: [
                        {
                            property: {
                                city: { in: cities },
                            },
                        },
                        {
                            pricePerMonth: {
                                gte: minPrice,
                                lte: maxPrice,
                            },
                        },
                    ],
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
                    images: {
                        take: 1,
                        orderBy: { displayOrder: 'asc' },
                    },
                },
                take: 6,
                orderBy: {
                    createdAt: 'desc',
                },
            });
        }

        // Fallback: If no favorites or not enough recommendations found
        if (!recommendedRooms || recommendedRooms.length < 3) {
            const existingIds = recommendedRooms?.map(r => r.id) || [];
            const favoritedRoomIds = favorites.map(f => f.roomId);

            const fallbackRooms = await this.prisma.room.findMany({
                where: {
                    status: RoomStatus.AVAILABLE,
                    id: { notIn: [...existingIds, ...favoritedRoomIds] },
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
                    images: {
                        take: 1,
                        orderBy: { displayOrder: 'asc' },
                    },
                },
                take: 6 - (recommendedRooms?.length || 0),
                orderBy: {
                    createdAt: 'desc',
                },
            });

            recommendedRooms = [...(recommendedRooms || []), ...fallbackRooms];
        }

        return recommendedRooms;
    }
}
