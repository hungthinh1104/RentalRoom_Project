import api from '@/lib/api/client';
import type {
    SystemFeedback,
    CreateSystemFeedbackDto,
    UpdateFeedbackStatusDto,
} from '../types';

const BASE_URL = '/feedback';

export const systemFeedbackApi = {
    /**
     * Submit system feedback (bug report, feature request, general)
     */
    async submit(dto: CreateSystemFeedbackDto): Promise<SystemFeedback> {
        const response = await api.post<SystemFeedback>(BASE_URL, dto);
        return response.data;
    },

    /**
     * Get all feedback (admin only)
     */
    async getAll(params?: {
        status?: string;
        type?: string;
        page?: number;
        limit?: number;
    }): Promise<{ data: SystemFeedback[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
        const response = await api.get<{ data: SystemFeedback[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(`${BASE_URL}/admin`, {
            params,
        });
        return response.data;
    },

    /**
     * Get my feedback
     */
    async getMine(): Promise<SystemFeedback[]> {
        const response = await api.get<SystemFeedback[]>(BASE_URL);
        return response.data;
    },

    /**
     * Update feedback status (admin only)
     */
    async updateStatus(id: string, dto: UpdateFeedbackStatusDto): Promise<SystemFeedback> {
        const response = await api.patch<SystemFeedback>(`${BASE_URL}/${id}/status`, dto);
        return response.data;
    },

    /**
     * Add response to feedback
     */
    async addResponse(id: string, responseText: string): Promise<SystemFeedback> {
        const response = await api.patch<SystemFeedback>(`${BASE_URL}/${id}/response`, { response: responseText });
        return response.data;
    },
};
