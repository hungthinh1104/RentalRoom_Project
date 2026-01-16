import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { favoritesApi } from '../api/favorites-api';
import { useSession } from 'next-auth/react';

// Global cache for favorite IDs to avoid multiple API calls
let favoritesCache: Set<string> | null = null;
let cachePromise: Promise<void> | null = null;

async function loadFavoritesCache(): Promise<Set<string>> {
  if (favoritesCache !== null) return favoritesCache;

  if (cachePromise) {
    await cachePromise;
    return favoritesCache ?? new Set();
  }

  cachePromise = (async () => {
    try {
      const favorites = await favoritesApi.getFavorites();
      favoritesCache = new Set(favorites.map((f) => f.id));
    } catch {
      favoritesCache = new Set();
    }
  })();

  await cachePromise;
  cachePromise = null;
  return favoritesCache ?? new Set();
}

// Invalidate cache when toggling
function invalidateFavoritesCache() {
  favoritesCache = null;
}

export function useFavorite(roomId: string) {
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { status } = useSession();

  useEffect(() => {
    let mounted = true;

    // Only fetch if user is authenticated
    if (status !== 'authenticated') {
      return;
    }

    const id = window.setTimeout(() => setLoading(true), 0);

    loadFavoritesCache().then((cache) => {
      if (mounted) {
        setIsFavorite(cache.has(roomId));
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(id);
    };

    return () => {
      mounted = false;
    };
  }, [roomId, status]);

  const toggle = useCallback(async () => {
    const prev = isFavorite;
    // Optimistic update
    setIsFavorite(!prev);

    try {
      const result = await favoritesApi.toggleFavorite(roomId);
      setIsFavorite(result.favorited);

      // Invalidate cache after successful toggle
      invalidateFavoritesCache();
    } catch {
      // Rollback on error
      setIsFavorite(prev);
      toast({ title: 'Lỗi', description: 'Không thể cập nhật yêu thích', variant: 'destructive' });
    }
  }, [isFavorite, roomId, toast]);

  return { isFavorite, toggle, loading } as const;
}

// Hook to get all favorites (for favorites page)
export function useFavorites() {
  const [favorites, setFavorites] = useState<Awaited<ReturnType<typeof favoritesApi.getFavorites>>>([]);
  const [loading, setLoading] = useState(true);
  const { status } = useSession();

  const refresh = useCallback(async () => {
    if (status !== 'authenticated') {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await favoritesApi.getFavorites();
      setFavorites(data);
      // Update cache
      favoritesCache = new Set(data.map((f) => f.id));
    } catch {
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { favorites, loading, refresh } as const;
}
