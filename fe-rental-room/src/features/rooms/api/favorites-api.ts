import api from '@/lib/api/client';

export const favoritesApi = {
  async toggleFavorite(roomId: string) {
    // Backend may implement toggle or separate POST/DELETE; adapt when BE is ready
    try {
      const { data } = await api.post('/favorites/toggle', { roomId });
      return data;
    } catch (err) {
      // Re-throw for caller to handle
      throw err;
    }
  },

  async getFavorites(): Promise<{ items: unknown[] }> {
    try {
      const { data } = await api.get('/favorites');
      return data as { items: unknown[] };
    } catch {
      // Return empty as fallback
      return { items: [] };
    }
  },
};