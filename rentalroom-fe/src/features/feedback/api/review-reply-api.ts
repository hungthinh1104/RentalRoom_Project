import api from '@/lib/api/client';
import type { ReviewReplyDto } from '../types';

export const reviewReplyApi = {
    /**
     * Reply to a room review (landlord only)
     */
    async replyToReview(reviewId: string, dto: ReviewReplyDto): Promise<unknown> {
        const response = await api.post(`/rooms/reviews/${reviewId}/reply`, dto);
        return response.data;
    },
};
