import { useCallback, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { semanticSearchApi, type UnifiedRoomSearchResult } from '../api/semantic-search-api';
import { type RoomFilterInput } from '@/features/rooms/schemas';
import { useDebounce } from '@/hooks/use-debounce';

interface UseAiSearchOptions {
  debounceMs?: number;
  searchMode?: 'semantic' | 'hybrid' | 'standard';
  limit?: number;
  enabled?: boolean;
  page?: number;
}

/**
 * Smart search hook with:
 * - Debounced semantic search (AI-powered natural language)
 * - Hybrid search combining semantic + filters
 * - Automatic cache management to reduce API calls
 * - Fallback to standard search when needed
 *
 * API Call Optimization:
 * - Semantic query: 1 API call (debounced, cached for 5min)
 * - Filters only: No extra API call (uses pagination)
 * - Semantic + filters: 1 API call (hybrid search)
 * - Empty query: 0 API calls (uses standard list)
 */
export function useAiSearch(
  query: string,
  filters?: RoomFilterInput,
  options: UseAiSearchOptions = {}
) {
  const {
    debounceMs = 800,
    searchMode = 'hybrid',
    limit = 12,
    enabled = true,
    page = 1,
  } = options;

  const queryClient = useQueryClient();
  const debouncedQuery = useDebounce(query, debounceMs);
  const [searchMethod, setSearchMethod] = useState<'semantic' | 'hybrid' | 'standard'>('standard');
  const performedQueriesRef = useRef<Set<string>>(new Set());

  // Determine which search method to use based on input
  const shouldUseSemanticSearch = useMemo(() => {
    return enabled && debouncedQuery.trim().length > 2;
  }, [enabled, debouncedQuery]);

  // Semantic/Hybrid search query
  const semanticQuery = useQuery({
    queryKey: ['rooms', 'semantic-search', debouncedQuery, filters],
    queryFn: async () => {
      if (searchMode === 'hybrid' && filters && Object.keys(filters).length > 0) {
        // Use hybrid search when both query and filters exist
        setSearchMethod('hybrid');
        return semanticSearchApi.hybridSearch(debouncedQuery, {
          minPrice: filters.minPrice,
          maxPrice: filters.maxPrice,
          minArea: filters.minArea,
          maxArea: filters.maxArea,
          amenities: filters.amenities,
        }, limit);
      } else {
        // Pure semantic search
        setSearchMethod('semantic');
        return semanticSearchApi.semanticSearch(debouncedQuery, limit);
      }
    },
    enabled: shouldUseSemanticSearch,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
    retry: 1,
  });

  // Fallback: if semantic/hybrid returns 0 results, try standard search with the same query
  const standardFallbackQuery = useQuery({
    queryKey: ['rooms', 'semantic-fallback', debouncedQuery, filters],
    queryFn: async () => {
      setSearchMethod('standard');
      return semanticSearchApi.standardSearch(
        { ...(filters || {}), search: debouncedQuery },
        page,
        limit,
      );
    },
    enabled: shouldUseSemanticSearch && !!semanticQuery.data && (semanticQuery.data.count ?? semanticQuery.data.results?.length ?? 0) === 0,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });

  // Standard search query (filters only, no semantic)
  const standardQuery = useQuery({
    queryKey: ['rooms', 'standard-search', filters, page],
    queryFn: async () => {
      setSearchMethod('standard');
      return semanticSearchApi.standardSearch(filters, page, limit);
    },
    enabled: enabled && !shouldUseSemanticSearch,
    staleTime: 2 * 60 * 1000, // 2 minutes cache
    gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
    retry: 1,
  });

  // Merge results from both queries
  const data = useMemo(() => {
    if (shouldUseSemanticSearch && semanticQuery.data) {
      // Prefer semantic results when available and non-empty
      if ((semanticQuery.data.count ?? semanticQuery.data.results?.length ?? 0) > 0) {
        return semanticQuery.data;
      }
      // Fall back to standard search when semantic returned empty
      if (standardFallbackQuery.data) {
        return {
          query: debouncedQuery,
          method: 'STANDARD' as const,
          count: standardFallbackQuery.data.count ?? 0,
          results: standardFallbackQuery.data.results ?? []
        };
      }
    }

    if (standardQuery.data) {
      // Normalize PaginatedResponse to UnifiedRoomSearchResult if needed
      if ('data' in standardQuery.data) {
        const sData = standardQuery.data as any; // Temporary cast to handle PaginatedResponse structure
        return {
          query: '',
          method: 'STANDARD' as const,
          count: sData.meta?.total ?? sData.data?.length ?? 0,
          results: sData.data ?? []
        };
      }
      return standardQuery.data as unknown as UnifiedRoomSearchResult;
    }
    return null;
  }, [shouldUseSemanticSearch, semanticQuery.data, standardQuery.data, standardFallbackQuery.data]);

  const isLoading = shouldUseSemanticSearch ? semanticQuery.isLoading : standardQuery.isLoading;
  const isFetching = shouldUseSemanticSearch ? (semanticQuery.isFetching || standardFallbackQuery.isFetching) : standardQuery.isFetching;
  const error = shouldUseSemanticSearch ? semanticQuery.error ?? standardFallbackQuery.error : standardQuery.error;

  // Prefetch popular searches for suggestions
  const prefetchPopularSearches = useCallback(async () => {
    try {
      await queryClient.prefetchQuery({
        queryKey: ['rooms', 'popular-searches'],
        queryFn: () => semanticSearchApi.getPopularSearches(10),
        staleTime: 10 * 60 * 1000, // 10 minutes
      });
    } catch (err) {
      console.warn('[useAiSearch] Failed to prefetch popular searches:', err);
    }
  }, [queryClient]);

  // Track performed queries for analytics
  const trackQuery = useCallback((q: string) => {
    performedQueriesRef.current.add(q);
  }, []);

  return {
    // Results
    data,
    rooms: data?.results || [],
    totalCount: data?.count || 0,

    // Status
    isLoading,
    isFetching,
    error,
    searchMethod,

    // Utilities
    prefetchPopularSearches,
    trackQuery,
    getPerformedQueries: () => Array.from(performedQueriesRef.current),
  };
}

/**
 * Hook to fetch popular searches for autocomplete suggestions
 * Optimized: Cached for 10 minutes, only fetches once per page load
 * Gracefully handles errors - returns empty list if API fails
 */
export function usePopularSearches(enabled: boolean = true) {
  return useQuery({
    queryKey: ['rooms', 'popular-searches'],
    queryFn: async () => {
      try {
        return await semanticSearchApi.getPopularSearches(10);
      } catch (error) {
        console.warn('[usePopularSearches] Failed to fetch, using fallback:', error);
        // Return empty popular searches, user can still use search history
        return { searches: [], period: 'last_7_days' };
      }
    },
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes cache
    gcTime: 30 * 60 * 1000, // 30 minutes garbage collection
    retry: 1,
  });
}
