import api from '@/lib/api/client';

export interface Contract {
  id: string;
  contractNumber?: string;
  status?: string;
  monthlyRent?: number;
  startDate?: string;
  endDate?: string;
  property?: { name?: string; city?: string; district?: string };
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
  name?: string;
  pricePerMonth?: number;
  city?: string;
  district?: string;
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
    // Fallback: not documented, keep empty list to avoid breaking UI
    return { items: [] as RoomSummary[], total: 0 };
  },

  async getRecommendations() {
    // Placeholder: use rooms listing as a simple recommendation proxy
    const { data } = await api.get<PaginatedResponse<RoomSummary>>('/rooms', {
      params: { status: 'AVAILABLE', limit: 3 },
    });
    return {
      items: data?.data ?? [],
      total: data?.meta?.total ?? data?.meta?.itemCount ?? (data?.data?.length ?? 0),
    };
  },
};
