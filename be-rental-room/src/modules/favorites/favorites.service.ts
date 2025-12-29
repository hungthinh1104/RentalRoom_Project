import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';

@Injectable()
export class FavoritesService {
    constructor(private readonly prisma: PrismaService) { }

    async toggleFavorite(tenantId: string, roomId: string) {
        // Check if room exists
        const room = await this.prisma.room.findUnique({
            where: { id: roomId, deletedAt: null },
        });

        if (!room) {
            throw new NotFoundException('Room not found');
        }

        // Check if already favorited
        const existing = await this.prisma.favoriteRoom.findUnique({
            where: {
                tenantId_roomId: {
                    tenantId,
                    roomId,
                },
            },
        });

        if (existing) {
            // Unfavorite
            await this.prisma.favoriteRoom.delete({
                where: {
                    id: existing.id,
                },
            });
            return { favorited: false };
        } else {
            // Favorite
            await this.prisma.favoriteRoom.create({
                data: {
                    tenantId,
                    roomId,
                },
            });
            return { favorited: true };
        }
    }

    async getFavoriteRooms(tenantId: string) {
        const favorites = await this.prisma.favoriteRoom.findMany({
            where: { tenantId },
            include: {
                room: {
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
                        amenities: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return favorites.map((f) => ({
            ...f.room,
            favoritedAt: f.createdAt,
        }));
    }
}
