"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api/client";
import { CreatePropertyInput, Property } from "../types";

export const propertyKeys = {
	all: ["properties"] as const,
	lists: () => [...propertyKeys.all, "list"] as const,
	list: (filters: any) => [...propertyKeys.lists(), { ...filters }] as const,
	details: () => [...propertyKeys.all, "detail"] as const,
	detail: (id: string) => [...propertyKeys.details(), id] as const,
};

export function useProperties(filters?: { search?: string }) {
	const queryClient = useQueryClient();

	// Fetch List
	const { data, isLoading, error } = useQuery({
		queryKey: propertyKeys.list(filters),
		queryFn: async () => {
			const params = new URLSearchParams();
			if (filters?.search) params.append("search", filters.search);
			// Ensure we explicitly request landlord properties if this is landlord view
			// But backend filters by CurrentUser role automatically for /properties

			const { data } = await api.get<{ data: Property[], meta: any }>(`/properties?${params.toString()}`);
			return data;
		},
		staleTime: 60 * 1000,
	});

	// Create Mutation
	const createMutation = useMutation({
		mutationFn: async (newProperty: CreatePropertyInput) => {
			const { data } = await api.post<Property>("/properties", newProperty);
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: propertyKeys.lists() });
		},
	});

	return {
		properties: data?.data ?? [],
		meta: data?.meta,
		isLoading,
		error,
		createProperty: createMutation.mutateAsync,
		isCreating: createMutation.isPending,
	};
}

// Fetch Single Property
export function useProperty(id: string) {
	return useQuery({
		queryKey: propertyKeys.detail(id),
		queryFn: async () => {
			const { data } = await api.get<Property>(`/properties/${id}`);
			return data;
		},
		enabled: !!id,
		staleTime: 60 * 1000,
	});
}
