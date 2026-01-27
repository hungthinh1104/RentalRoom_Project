import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { AnalysisService } from './analysis.service';
import { EmbeddingService } from './embedding.service';
import { CacheService } from 'src/common/services/cache.service';

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
      const cacheKey = `search:${query}:${limit}`;
      const cached = await this.cacheService.get(cacheKey);
      if (cached && typeof cached === 'string') {
        this.logger.log(`Cache HIT: ${query}`);
        return JSON.parse(cached);
      }

      const started = Date.now();
      const { filters, cleanedQuery } =
        await this.analysisService.analyzeSearchQuery(query);
      const effectiveQuery = cleanedQuery?.trim()?.length
        ? cleanedQuery
        : query;

      // Generate real embedding (Gemini text-embedding-004)
      const queryEmbedding =
        await this.embeddingService.generateEmbedding(effectiveQuery);

      // Run pgvector similarity to get candidate rooms using real data
      const candidates = await this.vectorSearch(queryEmbedding, limit * 3);

      if (!candidates.length) {
        this.logger.warn('No embedding candidates, fallback search');
        return this.fallbackSearch(limit);
      }

      const candidateIds = candidates.map((c) => c.roomId);
      const rooms = await this.prisma.room.findMany({
        where: { id: { in: candidateIds }, status: 'AVAILABLE' },
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
            select: { id: true, rating: true },
          },
        },
      });

      // Apply structured filters on real data
      const filtered = rooms.filter((room) => {
        if (
          filters.minPrice != null &&
          Number(room.pricePerMonth) < filters.minPrice
        )
          return false;
        if (
          filters.maxPrice != null &&
          Number(room.pricePerMonth) > filters.maxPrice
        )
          return false;
        if (filters.minArea != null && Number(room.area) < filters.minArea)
          return false;
        if (filters.maxArea != null && Number(room.area) > filters.maxArea)
          return false;

        if (filters.amenities && filters.amenities.length > 0) {
          const roomAmenityTypes = room.amenities.map((a: any) => a.type);
          const hasAmenity = filters.amenities.some((a) =>
            roomAmenityTypes.includes(a),
          );
          if (!hasAmenity) return false;
        }

        if (filters.location) {
          const haystack = [
            room.property?.address,
            room.property?.city,
            room.property?.ward,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          if (!haystack.includes(filters.location.toLowerCase())) return false;
        }

        return true;
      });

      const similarityMap = new Map(
        candidates.map((c) => [c.roomId, c.similarity]),
      );

      const results = filtered
        .map((room) => ({
          ...room,
          similarity: Number((similarityMap.get(room.id) ?? 0).toFixed(4)),
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, Math.min(limit, 50));

      await this.cacheService.set(cacheKey, JSON.stringify(results), 300);
      this.logger.log(
        `Semantic search OK: ${query} -> ${results.length} rooms in ${Date.now() - started}ms`,
      );

      return results;
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
    // Hybrid is now the same as semantic, but keeps signature for callers
    return this.semanticSearch(query, limit);
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
  async getPopularSearches(limit: number = 10) {
    const take = Math.min(limit, 20);
    try {
      const rows = await this.prisma.popularSearch.findMany({
        orderBy: [{ searchCount: 'desc' }, { lastSearched: 'desc' }],
        take,
        select: { query: true, searchCount: true },
      });

      return rows.map((r) => ({ query: r.query, count: r.searchCount }));
    } catch (error) {
      this.logger.warn(
        'Failed to load popular searches, returning empty',
        error,
      );
      return [];
    }
  }

  private async vectorSearch(embedding: number[], limit: number) {
    const vectorLiteral = `[${embedding.join(',')}]`;
    const rows = await this.prisma.$queryRaw<
      { room_id: string; distance: number }[]
    >`
      SELECT re.room_id, (re.embedding <=> ${vectorLiteral}::vector) AS distance
      FROM room_embedding re
      JOIN room r ON r.id = re.room_id
      WHERE r.status = 'AVAILABLE'
      ORDER BY re.embedding <=> ${vectorLiteral}::vector ASC
      LIMIT ${Math.max(1, limit)}
    `;

    return rows.map((row) => ({
      roomId: row.room_id,
      similarity: 1 - Number(row.distance),
    }));
  }
}
