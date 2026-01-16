/**
 * Differentiated caching configuration for TanStack Query
 * Different staleTime for different data types
 */

export const CACHE_CONFIG = {
    // Static data - rarely changes (properties, cities)
    STATIC: {
        staleTime: 30 * 60 * 1000, // 30 minutes
        cacheTime: 60 * 60 * 1000, // 1 hour
    },

    // Dynamic data - changes moderately (rooms, listings)
    DYNAMIC: {
        staleTime: 2 * 60 * 1000, // 2 minutes
        cacheTime: 5 * 60 * 1000, // 5 minutes
    },

    // Real-time data - changes frequently (notifications, messages)
    REALTIME: {
        staleTime: 0, // Always fresh
        cacheTime: 1 * 60 * 1000, // 1 minute
        refetchInterval: 30000, // Refetch every 30 seconds
    },

    // User data - moderate freshness (profile, favorites)
    USER: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 10 * 60 * 1000, // 10 minutes
    },

    // Search results - short cache (search queries)
    SEARCH: {
        staleTime: 1 * 60 * 1000, // 1 minute
        cacheTime: 3 * 60 * 1000, // 3 minutes
    },
} as const;

/**
 * Common query options with refetch strategies
 */
export const QUERY_OPTIONS = {
    // Refetch on window focus for important data
    withRefetch: {
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
    },

    // No refetch for static data
    noRefetch: {
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    },

    // Retry configuration
    retry: {
        retry: 3,
        retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
} as const;
