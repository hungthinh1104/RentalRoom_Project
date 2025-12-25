import api from '@/lib/api/client';
import type { Room, CreateRoomDto, PaginatedResponse, PaginationParams } from '@/types';

export const roomsApi = {
  getAll: async (params?: PaginationParams & { propertyId?: string; status?: string }) => {
    const { data } = await api.get<PaginatedResponse<Room>>('/rooms', { params });
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get<Room>(`/rooms/${id}`);
    return data;
  },

  create: async (dto: CreateRoomDto) => {
    const { data } = await api.post<Room>('/rooms', dto);
    return data;
  },

  update: async (id: string, dto: Partial<CreateRoomDto>) => {
    const { data } = await api.patch<Room>(`/rooms/${id}`, dto);
    return data;
  },

  delete: async (id: string) => {
    await api.delete(`/rooms/${id}`);
  },
};