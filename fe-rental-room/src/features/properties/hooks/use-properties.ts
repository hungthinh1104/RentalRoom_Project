import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { propertiesApi } from '../api/properties-api';
import type { CreatePropertyDto, PaginationParams, Property } from '@/types';

export function useProperties(params?: PaginationParams & { landlordId?: string }) {
	return useQuery({
		queryKey: ['properties', params],
		queryFn: () => propertiesApi.getAll(params),
		staleTime: 5 * 60 * 1000, // 5 minutes
	});
}

export function useProperty(id: string) {
	return useQuery({
		queryKey: ['properties', id],
		queryFn: () => propertiesApi.getById(id),
		enabled: !!id,
	});
}

export function useCreateProperty() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (dto: CreatePropertyDto) => propertiesApi.create(dto),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['properties'] });
		},
	});
}

export function useUpdateProperty() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, dto }: { id: string; dto: Partial<CreatePropertyDto> }) =>
			propertiesApi.update(id, dto),
		onSuccess: (_data: Property, variables: { id: string; dto: Partial<CreatePropertyDto> }) => {
			queryClient.invalidateQueries({ queryKey: ['properties'] });
			queryClient.invalidateQueries({ queryKey: ['properties', variables.id] });
		},
	});
}

export function useDeleteProperty() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => propertiesApi.delete(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['properties'] });
		},
	});
}
