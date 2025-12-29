import api from '@/lib/api/client';
import type { AiFeedbackDto } from '../types';

export const aiFeedbackApi = {
    /**
     * Submit feedback for AI interaction
     */
    async submitFeedback(dto: AiFeedbackDto): Promise<unknown> {
        const response = await api.post('/ai/feedback', dto);
        return response.data;
    },
};
