import { useQuery } from '@tanstack/react-query';
import { reportsApi, LandlordDashboardSummary, CashFlowSummary } from '@/lib/api/reportsApi';
import { queryKeys } from '@/lib/api/query-keys';

export function useLandlordDashboard(landlordId: string | undefined) {
    return useQuery({
        queryKey: landlordId ? queryKeys.reports.landlord(landlordId) : ['reports', 'landlord', 'anonymous'],
        queryFn: () => {
            if (!landlordId) throw new Error("Landlord ID required");
            return reportsApi.getLandlordSummary(landlordId);
        },
        enabled: !!landlordId,
        staleTime: 5 * 60 * 1000, // 5 minutes (Analytical data doesn't change fast)
        gcTime: 30 * 60 * 1000,   // Keep in cache for 30 mins
    });
}

export function useCashFlow(month?: string) {
    return useQuery({
        queryKey: queryKeys.reports.cashFlow(month),
        queryFn: () => reportsApi.getCashFlowSummary(month),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}
