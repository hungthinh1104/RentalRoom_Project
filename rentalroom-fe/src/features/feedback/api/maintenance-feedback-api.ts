import api from '@/lib/api/client';
import type { MaintenanceFeedbackDto } from '../types';

export const maintenanceFeedbackApi = {
    /**
     * Submit feedback for completed maintenance request
     */
    async submitFeedback(requestId: string, dto: MaintenanceFeedbackDto): Promise<unknown> {
        const response = await api.patch(`/maintenance/requests/${requestId}/feedback`, dto);
        return response.data;
    },
};
