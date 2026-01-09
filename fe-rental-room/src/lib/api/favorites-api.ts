import api from './client';

interface ToggleFavoriteParams {
    roomId: string;
}

interface FavoriteRoom {
    id: string;
    userId: string;
    roomId: string;
    createdAt: string;
    room: {
        id: string;
        roomNumber: string;
        area: number;
        price: number;
        status: string;
        property: {
            id: string;
            name: string;
            address: string;
        };
        images?: Array<{
            id: string;
            url: string;
        }>;
    };
}

export const favoritesApi = {
    /**
     * Toggle favorite status of a room
     */
    toggle: async (params: ToggleFavoriteParams) => {
        const { data } = await api.post('/favorites/toggle', params);
        return data;
    },

    /**
     * Get all favorite rooms for current user
     */
    getAll: async (): Promise<FavoriteRoom[]> => {
        const { data } = await api.get<FavoriteRoom[]>('/favorites');
        return data;
    },
};
