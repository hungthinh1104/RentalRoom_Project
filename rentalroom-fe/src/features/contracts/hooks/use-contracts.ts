import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contractsApi } from '../api/contracts-api';
import type { CreateContractDto, PaginationParams, Contract } from '@/types';
import { queryKeys } from '@/lib/api/query-keys';

// Application hooks have been moved to features/rental-applications/hooks/use-rental-applications.ts

// Contract hooks
export function useContracts(params?: PaginationParams & { tenantId?: string; landlordId?: string; status?: string }) {
	// Cast strict params to Record<string, unknown> for queryKey compatibility if needed
	const safeParams = params as unknown as Record<string, unknown>;
	return useQuery({
		queryKey: queryKeys.contracts.list(safeParams),
		queryFn: () => contractsApi.getContracts(params),
	});
}

export function useContract(id: string) {
	return useQuery({
		queryKey: queryKeys.contracts.detail(id),
		queryFn: () => contractsApi.getContractById(id),
		enabled: !!id,
	});
}

export function useCreateContract() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (dto: CreateContractDto) => contractsApi.createContract(dto),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.contracts.all });
			// Invalidate rooms as availability changes
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
			queryClient.invalidateQueries({ queryKey: queryKeys.contracts.all });
			queryClient.invalidateQueries({ queryKey: queryKeys.contracts.detail(variables.id) });
		},
	});
}

export function useTerminateContract() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: { reason: string; noticeDays?: number; terminationType?: string; refundAmount?: number } }) =>
			contractsApi.terminateContract(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.contracts.all });
			queryClient.invalidateQueries({ queryKey: ['rooms'] });
		},
	});
}

export function useRenewContract() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: { newEndDate: string; newRentPrice?: number; increasePercentage?: number } }) =>
			contractsApi.renewContract(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.contracts.all });
		},
	});
}

export function useAddResident() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ contractId, data }: { contractId: string; data: { fullName: string; phoneNumber?: string; citizenId?: string; relationship?: string } }) =>
			contractsApi.addResident(contractId, data),
		onSuccess: (_data: unknown, variables: { contractId: string }) => {
			queryClient.invalidateQueries({ queryKey: queryKeys.contracts.detail(variables.contractId) });
		},
	});
}

export function useUpdateResident() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ contractId, residentId, data }: { contractId: string; residentId: string; data: { fullName?: string; phoneNumber?: string; citizenId?: string; relationship?: string } }) =>
			contractsApi.updateResident(contractId, residentId, data),
		onSuccess: (_data: unknown, variables: { contractId: string }) => {
			queryClient.invalidateQueries({ queryKey: queryKeys.contracts.detail(variables.contractId) });
		},
	});
}

export function useRemoveResident() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ contractId, residentId }: { contractId: string; residentId: string }) =>
			contractsApi.removeResident(contractId, residentId),
		onSuccess: (_data: unknown, variables: { contractId: string }) => {
			queryClient.invalidateQueries({ queryKey: queryKeys.contracts.detail(variables.contractId) });
		},
	});
}
