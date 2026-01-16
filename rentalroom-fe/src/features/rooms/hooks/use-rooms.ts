"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api/client";
import { CreateRoomDto, Room, RoomStatus } from "../types";

export const roomKeys = {
	all: ["rooms"] as const,
	lists: () => [...roomKeys.all, "list"] as const,
	list: (filters: any) => [...roomKeys.lists(), { ...filters }] as const,
	details: () => [...roomKeys.all, "detail"] as const,
	detail: (id: string) => [...roomKeys.details(), id] as const,
};

interface RoomFilters {
	propertyId?: string;
	status?: RoomStatus;
	search?: string;
}

export function useRooms(filters?: RoomFilters) {
	const queryClient = useQueryClient();

	// Fetch List
	const { data, isLoading, error } = useQuery({
		queryKey: roomKeys.list(filters),
		queryFn: async () => {
			const params = new URLSearchParams();
			if (filters?.propertyId) params.append("propertyId", filters.propertyId);
			if (filters?.status) params.append("status", filters.status);
			if (filters?.search) params.append("search", filters.search);

			const { data } = await api.get<{ data: Room[], meta: any }>(`/rooms?${params.toString()}`);
			return data;
		},
		staleTime: 60 * 1000,
		enabled: !!filters?.propertyId || !!filters?.search, // Only fetch if context provided or searching default
	});

	// Create Single
	const createMutation = useMutation({
		mutationFn: async (newRoom: CreateRoomDto) => {
			const { data } = await api.post<Room>("/rooms", newRoom);
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: roomKeys.lists() });
		},
	});

	// Bulk Create
	const bulkCreateMutation = useMutation({
		mutationFn: async (input: CreateRoomDto) => {
			const { data } = await api.post<Room[]>("/rooms/bulk", input);
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: roomKeys.lists() });
		},
	});

	// Delete Room
	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			await api.delete(`/rooms/${id}`);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: roomKeys.lists() });
		},
	});

	return {
		rooms: data?.data ?? [],
		meta: data?.meta,
		isLoading,
		error,
		createRoom: createMutation.mutateAsync,
		bulkCreateRooms: bulkCreateMutation.mutateAsync,
		deleteRoom: deleteMutation.mutateAsync,
		isCreating: createMutation.isPending || bulkCreateMutation.isPending || deleteMutation.isPending,
	};
}

// Fetch Single Room
export function useRoom(id: string) {
	return useQuery({
		queryKey: roomKeys.detail(id),
		queryFn: async () => {
			const { data } = await api.get<Room>(`/rooms/${id}`);
			return data;
		},
		enabled: !!id,
		staleTime: 60 * 1000,
	});
}
