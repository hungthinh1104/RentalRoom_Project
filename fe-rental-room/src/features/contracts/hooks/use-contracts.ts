import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { contractsApi } from '../api/contracts-api';
import type { CreateContractDto, PaginationParams, Contract, RentalApplication } from '@/types';

// Application hooks
export function useApplications(
	params?: PaginationParams & { tenantId?: string; landlordId?: string; roomId?: string; status?: string },
	options?: { enabled?: boolean }
) {
	return useQuery({
		queryKey: ['applications', params],
		queryFn: () => contractsApi.getApplications(params),
		enabled: options?.enabled ?? true,
		placeholderData: keepPreviousData,
	});
}

export function useApplication(id: string) {
	return useQuery({
		queryKey: ['applications', id],
		queryFn: () => contractsApi.getApplicationById(id),
		enabled: !!id,
	});
}

export function useCreateApplication() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (dto: { tenantId: string; roomId: string; message?: string }) =>
			contractsApi.createApplication(dto),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['applications'] });
		},
	});
}

export function useApproveApplication() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => contractsApi.approveApplication(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['applications'] });
			queryClient.invalidateQueries({ queryKey: ['rooms'] });
		},
	});
}

export function useRejectApplication() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => contractsApi.rejectApplication(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['applications'] });
		},
	});
}

export function useWithdrawApplication() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => contractsApi.withdrawApplication(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['applications'] });
		},
	});
}

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
