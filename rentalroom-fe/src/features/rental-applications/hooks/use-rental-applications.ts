import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { rentalApplicationsApi } from '../api/rental-applications';
import type { PaginationParams } from '@/types';

export function useApplications(
    params?: PaginationParams & { tenantId?: string; landlordId?: string; roomId?: string; status?: string },
    options?: { enabled?: boolean }
) {
    return useQuery({
        queryKey: ['applications', params],
        queryFn: () => rentalApplicationsApi.getAll(params),
        enabled: options?.enabled ?? true,
        placeholderData: keepPreviousData,
    });
}

export function useApplication(id: string) {
    return useQuery({
        queryKey: ['applications', id],
        queryFn: () => rentalApplicationsApi.getOne(id),
        enabled: !!id,
    });
}

export function useApproveApplication() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => rentalApplicationsApi.approve(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['applications'] });
            queryClient.invalidateQueries({ queryKey: ['rooms'] });
        },
    });
}

export function useRejectApplication() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, reason }: { id: string; reason?: string }) => rentalApplicationsApi.reject(id, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['applications'] });
        },
    });
}

export function useWithdrawApplication() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => rentalApplicationsApi.withdraw(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['applications'] });
        },
    });
}
