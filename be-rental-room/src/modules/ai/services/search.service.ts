import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { AnalysisService } from './analysis.service';
import { EmbeddingService } from './embedding.service';
import { CacheService } from 'src/common/services/cache.service';

interface RoomWithSimilarity {
  room: any;
  similarity: number;
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingService: EmbeddingService,
    private readonly cacheService: CacheService,
    private readonly analysisService: AnalysisService, // Injected
  ) {}

  /**
   * Semantic search using vector similarity
   * Finds rooms similar to user's natural language query
   *
   * @param query - Natural language search query
   * @param limit - Maximum number of results
   * @returns Rooms sorted by semantic similarity
   */
  async semanticSearch(query: string, limit: number = 12) {
    try {
      // Step 1: Analyze query to extract structured filters (Price, Area, Location)
      // This fixes the issue where "dưới 3 triệu" is treated as keywords instead of a logical filter
      const { filters, cleanedQuery } =
        await this.analysisService.analyzeSearchQuery(query);

      // Step 2: If significant filters are found, use Hybrid Search for accuracy
      const hasFilters =
        filters.minPrice !== undefined ||
        filters.maxPrice !== undefined ||
        filters.minArea !== undefined ||
        filters.maxArea !== undefined ||
        filters.location !== undefined ||
        (filters.amenities && filters.amenities.length > 0);

      if (hasFilters) {
        this.logger.log(
          `Smart routing to Hybrid Search: ${JSON.stringify(filters)}`,
        );

        // If location is detected, append it to the query for text matching valid rooms in that area
        const effectiveQuery = filters.location
          ? `${cleanedQuery} ${filters.location}`.trim()
          : cleanedQuery || query; // Fallback to original query if cleaned is empty

        return this.hybridSearch(effectiveQuery, filters, limit);
      }

      // Step 3: Fallback to existing keyword/vector search logic if no filters

      // Fetch all available rooms with relations
      const rooms = await this.prisma.room.findMany({
        include: {
          property: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
              ward: true,
              propertyType: true,
            },
          },
          amenities: true,
          images: true,
          reviews: {
            select: {
              id: true,
              rating: true,
            },
          },
        },
        where: {
          status: 'AVAILABLE',
        },
      });

      // Calculate similarity for each room based on text matching
      const roomsWithSimilarity: RoomWithSimilarity[] = rooms
        .map((room) => {
          // Create text representation combining multiple fields
          const roomText = [
            room.description || '',
            room.property?.name || '',
            room.property?.address || '',
            room.amenities?.map((a: any) => a.type).join(' ') || '',
          ]
            .join(' ')
            .toLowerCase();

          // Text-based similarity (keyword matching)
          const queryWords = query
            .toLowerCase()
            .split(/\s+/)
            .filter((w) => w.length > 0);
          const matchedWords = queryWords.filter((word) =>
            roomText.includes(word),
          ).length;
          const textSimilarity =
            queryWords.length > 0 ? matchedWords / queryWords.length : 0;

          return {
            room: {
              id: room.id,
              roomNumber: room.roomNumber,
              pricePerMonth: Number(room.pricePerMonth),
              deposit: Number(room.deposit),
              area: Number(room.area),
              maxOccupants: room.maxOccupants,
              status: room.status,
              description: room.description,
              property: room.property,
              amenities: room.amenities,
              images: room.images,
              reviews: room.reviews,
            },
            similarity: textSimilarity,
          };
        })
        .filter((r) => r.similarity > 0)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, Math.min(limit, 50));

      return roomsWithSimilarity.map((r) => ({
        ...r.room,
        similarity: parseFloat(r.similarity.toFixed(2)),
      }));
    } catch (error) {
      this.logger.error(`Semantic search failed:`, error);
      return this.fallbackSearch(limit);
    }
  }

  /**
   * Hybrid search combining semantic + filter constraints
   * Filters results first, then ranks by semantic similarity
   *
   * @param query - Natural language search query
   * @param filters - Price, area, amenities filters
   * @param limit - Maximum number of results
   * @returns Filtered and ranked rooms
   */
  async hybridSearch(
    query: string,
    filters?: {
      minPrice?: number;
      maxPrice?: number;
      minArea?: number;
      maxArea?: number;
      amenities?: string[];
    },
    limit: number = 12,
  ) {
    try {
      // Build where clause for filtering
      const where: any = {
        status: 'AVAILABLE',
      };

      if (filters?.minPrice != null || filters?.maxPrice != null) {
        where.pricePerMonth = {};
        if (filters?.minPrice != null) {
          where.pricePerMonth.gte = Number(filters.minPrice);
        }
        if (filters?.maxPrice != null) {
          where.pricePerMonth.lte = Number(filters.maxPrice);
        }
      }

      if (filters?.minArea != null || filters?.maxArea != null) {
        where.area = {};
        if (filters?.minArea != null) {
          where.area.gte = Number(filters.minArea);
        }
        if (filters?.maxArea != null) {
          where.area.lte = Number(filters.maxArea);
        }
      }

      // Fetch filtered rooms
      const rooms = await this.prisma.room.findMany({
        where,
        include: {
          property: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
              ward: true,
              propertyType: true,
            },
          },
          amenities: true,
          images: true,
          reviews: {
            select: {
              id: true,
              rating: true,
            },
          },
        },
      });

      // Apply amenity filter if provided
      let filteredRooms = rooms;
      if (filters?.amenities && filters.amenities.length > 0) {
        filteredRooms = rooms.filter((room) => {
          const roomAmenities = room.amenities.map((a: any) => a.type);
          return filters.amenities!.some((amenity) =>
            roomAmenities.includes(amenity),
          );
        });
      }

      // Rank by semantic similarity to query
      const roomsWithSimilarity: RoomWithSimilarity[] = filteredRooms
        .map((room) => {
          const roomText = [
            room.description || '',
            room.property?.name || '',
            room.property?.address || '',
            room.amenities?.map((a: any) => a.type).join(' ') || '',
          ]
            .join(' ')
            .toLowerCase();

          const queryWords = query.toLowerCase().split(/\s+/);
          const matchedWords = queryWords.filter((word) =>
            roomText.includes(word),
          ).length;
          const similarity = matchedWords / (queryWords.length || 1);

          return {
            room: {
              id: room.id,
              roomNumber: room.roomNumber,
              pricePerMonth: Number(room.pricePerMonth),
              deposit: Number(room.deposit),
              area: Number(room.area),
              maxOccupants: room.maxOccupants,
              status: room.status,
              description: room.description,
              property: room.property,
              amenities: room.amenities,
              images: room.images,
              reviews: room.reviews,
            },
            similarity,
          };
        })
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, Math.min(limit, 50));

      return roomsWithSimilarity.map((r) => ({
        ...r.room,
        similarity: parseFloat(r.similarity.toFixed(2)),
      }));
    } catch (error) {
      this.logger.error(`Hybrid search failed:`, error);
      return this.fallbackSearch(limit);
    }
  }

  /**
   * Fallback search when AI fails
   * Returns available rooms sorted by newest first
   */
  private async fallbackSearch(limit: number = 12) {
    const rooms = await this.prisma.room.findMany({
      where: { status: 'AVAILABLE' },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            ward: true,
            propertyType: true,
          },
        },
        amenities: true,
        images: true,
        reviews: {
          select: {
            id: true,
            rating: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 50),
    });

    return rooms.map((room) => ({
      id: room.id,
      roomNumber: room.roomNumber,
      pricePerMonth: Number(room.pricePerMonth),
      deposit: Number(room.deposit),
      area: Number(room.area),
      maxOccupants: room.maxOccupants,
      status: room.status,
      description: room.description,
      property: room.property,
      amenities: room.amenities,
      images: room.images,
      reviews: room.reviews,
      similarity: 0,
    }));
  }

  /**
   * Get popular searches for autocomplete
   * Returns most common search queries
   */
  getPopularSearches(limit: number = 10) {
    // For now, return mock popular searches
    // In production, you would track actual searches in database
    const mockSearches = [
      { query: 'phòng trọ gần trường', count: 245 },
      { query: 'nhà trọ có máy lạnh', count: 189 },
      { query: 'phòng thuê giá rẻ', count: 156 },
      { query: 'căn hộ mini đầy đủ nội thất', count: 142 },
      { query: 'phòng ở gần chợ', count: 128 },
      { query: 'nhà nguyên căn 2 phòng', count: 115 },
      { query: 'phòng trọ an toàn', count: 98 },
      { query: 'căn hộ tầng cao thoáng mát', count: 87 },
      { query: 'phòng có ban công', count: 76 },
      { query: 'nhà trọ gần bệnh viện', count: 65 },
    ];

    return mockSearches.slice(0, Math.min(limit, 20));
  }
}
