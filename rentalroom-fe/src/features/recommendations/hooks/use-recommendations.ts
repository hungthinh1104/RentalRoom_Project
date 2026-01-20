import { useQuery } from '@tanstack/react-query';
import { recommendationsApi } from '../api/recommendations-api';

export function useRecommendations() {
    return useQuery({
        queryKey: ['recommendations', 'personalized'],
        queryFn: () => recommendationsApi.getPersonalized(),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
