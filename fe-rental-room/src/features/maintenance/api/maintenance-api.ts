import api from '@/lib/api/client';
import type { NewMaintenanceRequest, MaintenanceRequestSummary } from '../types';

export const maintenanceApi = {
  async createRequest(dto: NewMaintenanceRequest): Promise<MaintenanceRequestSummary> {
    const { data } = await api.post<MaintenanceRequestSummary>('/maintenance/requests', dto);
    return data;
  },

  async getRequests(params?: Record<string, unknown>) {
    const { data } = await api.get<{ data: MaintenanceRequestSummary[]; total: number }>(
      '/maintenance/requests',
      { params },
    );
    return data;
  },
};
