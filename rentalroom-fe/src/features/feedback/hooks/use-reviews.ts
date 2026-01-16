import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewsApi } from '../api/reviews-api';
import { toast } from 'sonner';

export function useLandlordReviews(landlordId?: string) {
    return useQuery({
        queryKey: ['landlord-reviews', landlordId],
        queryFn: () => reviewsApi.getLandlordReviews(landlordId!),
        enabled: !!landlordId,
    });
}

export function useReplyToReview() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ reviewId, reply }: { reviewId: string; reply: string }) =>
            reviewsApi.replyToReview(reviewId, reply),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['landlord-reviews'] });
            toast.success('Đã gửi phản hồi thành công');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Không thể gửi phản hồi');
        },
    });
}
