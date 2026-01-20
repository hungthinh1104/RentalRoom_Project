import api from '@/lib/api/client';
import { RecommendedRoom } from '../types';

const BASE_URL = '/recommendations';

export const recommendationsApi = {
    /**
     * Get personalized room recommendations for the current tenant
     */
    async getPersonalized(): Promise<RecommendedRoom[]> {
        const response = await api.get<RecommendedRoom[]>(BASE_URL);
        return response.data;
    },
};
