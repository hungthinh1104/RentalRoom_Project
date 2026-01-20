import api from '@/lib/api/client';
import { FavoriteRoom } from '@/lib/api/favorites-api';

export interface Contract {
  id: string;
  contractNumber?: string;
  status?: string;
  monthlyRent?: number;
  startDate?: string;
  endDate?: string;
  property?: { name?: string; city?: string; ward?: string };
}

export interface Payment {
  id: string;
  invoiceId?: string;
  amount?: number;
  status?: string;
  dueDate?: string;
}

export interface RoomSummary {
  id: string;
  name: string;
  pricePerMonth: number;
  city?: string;
  ward?: string;
  district?: string;
  roomType?: string;
  images?: string[];
}

interface PaginatedResponse<T> {
  data?: T[];
  meta?: {
    total?: number;
    itemCount?: number;
  };
}

export const tenantDashboardApi = {
  async getActiveContracts() {
    const { data } = await api.get<PaginatedResponse<Contract>>('/contracts', {
      params: { status: 'ACTIVE', limit: 3 },
    });
    return {
      items: data?.data ?? [],
      total: data?.meta?.total ?? data?.meta?.itemCount ?? (data?.data?.length ?? 0),
    };
  },

  async getPendingPayments() {
    const { data } = await api.get<PaginatedResponse<Payment>>('/payments', {
      params: { status: 'PENDING', limit: 3 },
    });
    return {
      items: data?.data ?? [],
      total: data?.meta?.total ?? data?.meta?.itemCount ?? (data?.data?.length ?? 0),
    };
  },

  async getFavorites() {
    const { data } = await api.get<PaginatedResponse<FavoriteRoom>>('/favorites');
    return {
      items: data?.data ?? [],
      total: data?.meta?.total ?? 0,
    };
  },

  async getRecommendations() {
    const { data } = await api.get<RoomSummary[]>('/recommendations');
    // Map backend response to the expected format if necessary,
    // but the backend returns Room objects which matches generic structure.
    // The frontend hook might expect { data: [] } or just [].
    // Let's check backend return type: `recommendedRooms` is Room[].
    // Frontend likely uses GenericResponse or similar.
    // Let's wrap it in { data: ... } to match other APIs if needed or just return data.
    // However, usually `api.get` returns AxiosResponse. `data` is the payload.
    // If backend returns Array, `data` is Array.
    // Let's assume standard response format.
    return {
      items: data ?? [],
      total: data?.length ?? 0,
    };
  },

  async getOpenMaintenance(tenantId: string) {
    const { data } = await api.get<{ data: unknown[]; total?: number } | unknown[]>('/maintenance/requests', {
      params: { tenantId, limit: 100 },
    });
    // Handle both array and object responses
    const items = Array.isArray(data) ? data : data?.data ?? [];
    // Filter out completed/cancelled ones
    const openItems = items.filter((item: unknown) => {
      const typedItem = item as { status?: string };
      return typedItem.status !== 'COMPLETED' && typedItem.status !== 'CANCELLED';
    });
    return {
      items: openItems,
      total: openItems.length,
    };
  },

  async getActiveBookings(tenantId: string) {
    const { data } = await api.get<PaginatedResponse<unknown> | unknown[]>('/rental-applications', {
      params: { tenantId, limit: 100 },
    });
    // Handle both array and object responses
    const items = Array.isArray(data) ? data : data?.data ?? [];
    // Filter active bookings (PENDING or APPROVED)
    const activeItems = items.filter((item: unknown) => {
      const typedItem = item as { status?: string };
      return typedItem.status === 'PENDING' || typedItem.status === 'APPROVED';
    });
    return {
      items: activeItems,
      total: activeItems.length,
    };
  },
};
