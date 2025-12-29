import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { favoritesApi } from '../api/favorites-api';

export function useFavorite(roomId: string) {
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;
    try {
      const raw = localStorage.getItem('favorites') || '[]';
      const favs: string[] = JSON.parse(raw);
      const isFav = favs.includes(roomId);
      // Defer state update to avoid synchronous setState in effect
      setTimeout(() => {
        if (mounted) setIsFavorite(isFav);
      }, 0);
    } catch {
      setTimeout(() => {
        if (mounted) setIsFavorite(false);
      }, 0);
    }
    return () => {
      mounted = false;
    };
  }, [roomId]);

  const updateLocal = useCallback((id: string, add: boolean) => {
    try {
      const raw = localStorage.getItem('favorites') || '[]';
      const favs: string[] = JSON.parse(raw);
      let next = favs.slice();
      if (add) {
        if (!next.includes(id)) next.push(id);
      } else {
        next = next.filter((x) => x !== id);
      }
      localStorage.setItem('favorites', JSON.stringify(next));
    } catch {
      // ignore localStorage errors
    }
  }, []);

  const toggle = useCallback(async () => {
    const prev = isFavorite;
    // optimistic
    setIsFavorite(!prev);
    updateLocal(roomId, !prev);
    setLoading(true);
    try {
      await favoritesApi.toggleFavorite(roomId);
      setLoading(false);
    } catch {
      // rollback
      setIsFavorite(prev);
      updateLocal(roomId, prev);
      setLoading(false);
      toast({ title: 'Lỗi', description: 'Không thể cập nhật yêu thích', variant: 'destructive' });
    }
  }, [isFavorite, roomId, updateLocal, toast]);

  return { isFavorite, toggle, loading } as const;
}
