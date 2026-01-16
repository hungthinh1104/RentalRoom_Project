import api from '@/lib/api/client';
import type {
  NewMaintenanceRequest,
  MaintenanceRequestSummary,
  UpdateMaintenanceRequest,
  MaintenanceFeedback
} from '../types';

export const maintenanceApi = {
  // Create a new maintenance request
  async createRequest(dto: NewMaintenanceRequest): Promise<MaintenanceRequestSummary> {
    const { data } = await api.post<MaintenanceRequestSummary>('/maintenance/requests', dto);
    return data;
  },

  // Get all maintenance requests with filters
  async getRequests(params?: Record<string, unknown>) {
    const { data } = await api.get<{ data: MaintenanceRequestSummary[]; total: number }>(
      '/maintenance/requests',
      { params },
    );
    return data;
  },

  // Get a single maintenance request by ID
  async getRequestById(id: string): Promise<MaintenanceRequestSummary> {
    const { data } = await api.get<MaintenanceRequestSummary>(`/maintenance/requests/${id}`);
    return data;
  },

  // Update a maintenance request (Admin/Landlord only)
  async updateRequest(id: string, dto: UpdateMaintenanceRequest): Promise<MaintenanceRequestSummary> {
    const { data } = await api.patch<MaintenanceRequestSummary>(`/maintenance/requests/${id}`, dto);
    return data;
  },

  // Mark a maintenance request as complete (Admin/Landlord only)
  async completeRequest(id: string): Promise<MaintenanceRequestSummary> {
    const { data } = await api.patch<MaintenanceRequestSummary>(`/maintenance/requests/${id}/complete`);
    return data;
  },

  // Delete a maintenance request (Admin only)
  async deleteRequest(id: string): Promise<void> {
    await api.delete(`/maintenance/requests/${id}`);
  },

  // Submit feedback for a completed maintenance request
  async submitFeedback(id: string, dto: MaintenanceFeedback): Promise<MaintenanceRequestSummary> {
    const { data } = await api.patch<MaintenanceRequestSummary>(`/maintenance/requests/${id}/feedback`, dto);
    return data;
  },
};
