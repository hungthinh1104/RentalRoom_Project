import api from './client';

interface CreateApplicationParams {
  roomId: string;
  tenantId: string;
  message?: string;
  requestedMoveInDate?: string;
}

interface RentalApplicationResponse {
  id: string;
  roomId: string;
  tenantId: string;
  landlordId: string;
  applicationDate: string;
  status: string;
  requestedMoveInDate?: string;
  message?: string;
  createdAt: string;
  updatedAt: string;
}

export const contractsApi = {
  // Create rental application
  async createApplication(
    params: CreateApplicationParams,
  ): Promise<RentalApplicationResponse> {
    const { data } = await api.post<RentalApplicationResponse>('/contracts/applications', {
      roomId: params.roomId,
      tenantId: params.tenantId,
      message: params.message,
      requestedMoveInDate: params.requestedMoveInDate,
    });
    return data;
  },

  // Get all applications
  async getApplications(filters?: {
    page?: number;
    limit?: number;
    tenantId?: string;
    landlordId?: string;
    roomId?: string;
    status?: string;
  }): Promise<{ data: RentalApplicationResponse[]; total: number }> {
    const queryParams = new URLSearchParams();
    if (filters?.page) queryParams.append('page', String(filters.page));
    if (filters?.limit) queryParams.append('limit', String(filters.limit));
    if (filters?.tenantId) queryParams.append('tenantId', filters.tenantId);
    if (filters?.landlordId) queryParams.append('landlordId', filters.landlordId);
    if (filters?.roomId) queryParams.append('roomId', filters.roomId);
    if (filters?.status) queryParams.append('status', filters.status);

    const query = queryParams.toString();
    const url = query ? `/contracts/applications?${query}` : '/contracts/applications';

    const { data } = await api.get(url);
    return data;
  },

  // Get single application
  async getApplication(id: string): Promise<RentalApplicationResponse> {
    const { data } = await api.get<RentalApplicationResponse>(`/contracts/applications/${id}`);
    return data;
  },

  // Approve application
  async approveApplication(id: string): Promise<RentalApplicationResponse> {
    const { data } = await api.patch<RentalApplicationResponse>(
      `/contracts/applications/${id}/approve`,
      {},
    );
    return data;
  },

  // Reject application
  async rejectApplication(id: string): Promise<RentalApplicationResponse> {
    const { data } = await api.patch<RentalApplicationResponse>(
      `/contracts/applications/${id}/reject`,
      {},
    );
    return data;
  },
};
