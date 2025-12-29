import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { contractsApi } from '../api/contracts-api';
import type { CreateContractDto, PaginationParams, Contract } from '@/types';

// Application hooks have been moved to features/rental-applications/hooks/use-rental-applications.ts

// Contract hooks
export function useContracts(params?: PaginationParams & { tenantId?: string; landlordId?: string; status?: string }) {
	return useQuery({
		queryKey: ['contracts', params],
		queryFn: () => contractsApi.getContracts(params),
	});
}

export function useContract(id: string) {
	return useQuery({
		queryKey: ['contracts', id],
		queryFn: () => contractsApi.getContractById(id),
		enabled: !!id,
	});
}

export function useCreateContract() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (dto: CreateContractDto) => contractsApi.createContract(dto),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['contracts'] });
			queryClient.invalidateQueries({ queryKey: ['rooms'] });
		},
	});
}

export function useUpdateContract() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, dto }: { id: string; dto: Partial<CreateContractDto> }) =>
			contractsApi.updateContract(id, dto),
		onSuccess: (_data: Contract, variables: { id: string }) => {
			queryClient.invalidateQueries({ queryKey: ['contracts'] });
			queryClient.invalidateQueries({ queryKey: ['contracts', variables.id] });
		},
	});
}

export function useTerminateContract() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: { reason: string; noticeDays?: number } }) =>
			contractsApi.terminateContract(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['contracts'] });
			queryClient.invalidateQueries({ queryKey: ['rooms'] });
		},
	});
}
