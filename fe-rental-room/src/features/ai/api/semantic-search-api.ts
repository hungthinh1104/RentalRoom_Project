import api from '@/lib/api/client';
import type { Room, PaginatedResponse } from '@/types';

export interface SemanticSearchResponse {
  query: string;
  method: 'SEMANTIC' | 'HYBRID' | 'STANDARD';
  count: number;
  results: Room[];
  responseTime?: string;
  timestamp?: string;
}

export const semanticSearchApi = {
  /**
   * Semantic search using Vietnamese natural language
   * Example: "phòng trọ gần trường có máy lạnh"
   * Optimized for: Single natural language query
   * API calls: 1 (semantic search)
   */
  async semanticSearch(query: string, limit: number = 12) {
    const trimmed = (query || '').toString().trim();
    if (!trimmed) {
      console.warn('[semanticSearch] Empty query provided; returning empty result');
      return {
        query: trimmed,
        method: 'STANDARD' as const,
        count: 0,
        results: [],
      };
    }

    try {
      const { data } = await api.get<SemanticSearchResponse>('/ai/search/semantic', {
        params: { q: trimmed, limit: Math.min(limit, 50) },
      });
      return data;
    } catch (error) {
      // Log detailed error information for easier debugging
      const err = error as { status?: number; statusCode?: number; message?: string } | undefined;
      const status = err?.statusCode ?? err?.status ?? undefined;
      console.error('[semanticSearch] Error (status):', status, error);
      console.error('[semanticSearch] Query was:', trimmed);
      console.error('[semanticSearch] Falling back to standard search');

      // Fallback to standard search on error
      try {
        const standardData = await this.standardSearch({ search: trimmed }, 1, limit);
        // Convert PaginatedResponse to SemanticSearchResponse format
        return {
          query: trimmed,
          method: 'STANDARD' as const,
          count: standardData.data?.length ?? 0,
          results: standardData.data ?? [],
        };
      } catch (fallbackError) {
        console.error('[semanticSearch] Fallback also failed:', fallbackError);
        // Return empty results if both fail
        return {
          query: trimmed,
          method: 'STANDARD' as const,
          count: 0,
          results: [],
        };
      }
    }
  },

  /**
   * Hybrid search combining semantic + filters
   * Optimized for: Natural language + structured filters
   * API calls: 1 (hybrid search with integrated filters)
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
    limit: number = 12
  ) {
    try {
      const { data } = await api.get<SemanticSearchResponse>('/ai/search/hybrid', {
        params: {
          q: query,
          minPrice: filters?.minPrice,
          maxPrice: filters?.maxPrice,
          minArea: filters?.minArea,
          maxArea: filters?.maxArea,
          amenities: filters?.amenities?.join(','),
          limit: Math.min(limit, 50),
        },
      });
      return data;
    } catch (error) {
      console.error('[hybridSearch] Error:', error);
      // Fallback to standard search with filters
      try {
        const standardData = await this.standardSearch(
          { ...filters, search: query },
          1,
          limit
        );
        // Convert PaginatedResponse to SemanticSearchResponse format
        return {
          query,
          method: 'STANDARD' as const,
          count: standardData.data?.length ?? 0,
          results: standardData.data ?? [],
        };
      } catch (fallbackError) {
        console.error('[hybridSearch] Fallback also failed:', fallbackError);
        return {
          query,
          method: 'STANDARD' as const,
          count: 0,
          results: [],
        };
      }
    }
  },

  /**
   * Standard paginated search with filters
   * Optimized for: Traditional filter-based search
   * API calls: 1 (standard pagination + filters)
   */
  async standardSearch(
    filters?: {
      search?: string;
      status?: string;
      minPrice?: number;
      maxPrice?: number;
      minArea?: number;
      maxArea?: number;
      amenities?: string[];
      sortBy?: string;
      sortOrder?: string;
    },
    page: number = 1,
    limit: number = 12
  ) {
    const { data } = await api.get<PaginatedResponse<Room>>('/rooms', {
      params: {
        search: filters?.search,
        status: filters?.status,
        minPrice: filters?.minPrice,
        maxPrice: filters?.maxPrice,
        minArea: filters?.minArea,
        maxArea: filters?.maxArea,
        amenities: filters?.amenities?.join(','),
        sortBy: filters?.sortBy,
        sortOrder: filters?.sortOrder,
        page,
        limit,
      },
    });
    return data;
  },

  /**
   * Get popular searches for suggestions
   * Optimized for: Search autocomplete
   * API calls: 1 (cached popular searches)
   * Fallback: Returns mock popular searches if API fails
   */
  async getPopularSearches(limit: number = 10) {
    try {
      const { data } = await api.get<{
        searches: Array<{ query: string; count: number }>;
        period: string;
      }>('/ai/analytics/popular-searches', {
        params: { limit: Math.min(limit, 20) },
      });
      return data;
    } catch (error) {
      console.warn('[getPopularSearches] API failed, using mock data:', error);
      // Return mock popular searches as fallback
      return {
        searches: [
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
        ].slice(0, limit),
        period: 'last_7_days',
      };
    }
  },
};
