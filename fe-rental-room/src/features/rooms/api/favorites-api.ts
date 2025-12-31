import api from '@/lib/api/client';

export interface FavoriteRoom {
  id: string;
  roomNumber: string;
  area: number;
  pricePerMonth: number;
  deposit: number;
  status: string;
  description?: string;
  maxOccupants?: number;
  property: {
    id: string;
    name: string;
    address: string;
    city: string;
    ward: string;
  };
  images: { id: string; imageUrl: string; displayOrder: number }[];
  amenities: { id: string; amenityType: string; quantity: number }[];
  favoritedAt: string;
}

export interface ToggleFavoriteResponse {
  favorited: boolean;
}

export const favoritesApi = {
  async toggleFavorite(roomId: string): Promise<ToggleFavoriteResponse> {
    const { data } = await api.post<ToggleFavoriteResponse>('/favorites/toggle', { roomId });
    return data;
  },

  async getFavorites(): Promise<FavoriteRoom[]> {
    const { data } = await api.get<FavoriteRoom[]>('/favorites');
    return data ?? [];
  },

  async checkIsFavorite(roomId: string): Promise<boolean> {
    try {
      const favorites = await this.getFavorites();
      return favorites.some((f) => f.id === roomId);
    } catch {
      return false;
    }
  },
};