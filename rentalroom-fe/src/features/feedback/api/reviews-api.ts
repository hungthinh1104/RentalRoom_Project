import api from '@/lib/api/client';

export interface RoomReview {
    id: string;
    tenantId: string;
    roomId: string;
    contractId: string;
    rating: number;
    cleanlinessRating: number;
    locationRating: number;
    valueRating: number;
    comment?: string;
    reviewImages?: string[];
    landlordReply?: string;
    repliedAt?: string;
    isVisible: boolean;
    createdAt: string;
    tenant?: {
        user?: {
            id: string;
            fullName: string;
            email?: string;
        };
    };
    room?: {
        id: string;
        roomNumber: string;
        property?: {
            id: string;
            name: string;
        };
    };
}

export interface ReviewsResponse {
    data: RoomReview[];
    total: number;
}

export const reviewsApi = {
    /**
     * Get all reviews for rooms owned by a landlord
     * Since backend doesn't have a direct endpoint, we fetch rooms and get reviews from there
     */
    async getLandlordReviews(landlordId: string): Promise<ReviewsResponse> {
        // Fetch landlord's properties first
        const { data: propertiesRes } = await api.get<{ data: { id: string }[] }>('/properties', {
            params: { landlordId },
        });
        const properties = propertiesRes?.data || [];

        if (properties.length === 0) {
            return { data: [], total: 0 };
        }

        // Fetch rooms for all properties and collect reviews
        const allReviews: RoomReview[] = [];
        const { data } = await api.get<ReviewsResponse>(`/rooms/reviews/landlord/${landlordId}`);
        return data;
    },

    /**
     * Reply to a room review
     */
    async replyToReview(reviewId: string, reply: string): Promise<RoomReview> {
        const { data } = await api.post<RoomReview>(`/rooms/reviews/${reviewId}/reply`, {
            reply,
        });
        return data;
    },
};
