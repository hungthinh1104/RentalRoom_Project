import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roomsApi } from '../api/rooms-api';
import type { CreateRoomDto, PaginationParams, RoomStatus, Room } from '@/types';

export function useRooms(params?: PaginationParams & { propertyId?: string; status?: RoomStatus }) {
	return useQuery({
		queryKey: ['rooms', params],
		queryFn: () => roomsApi.getAll(params),
		staleTime: 2 * 60 * 1000, // 2 minutes
	});
}

export function useRoom(id: string) {
	return useQuery({
		queryKey: ['rooms', id],
		queryFn: () => roomsApi.getById(id),
		enabled: !!id,
	});
}

export function useCreateRoom() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (dto: CreateRoomDto) => roomsApi.create(dto),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['rooms'] });
		},
	});
}

export function useUpdateRoom() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, dto }: { id: string; dto: Partial<CreateRoomDto> }) =>
			roomsApi.update(id, dto),
		onSuccess: (_data: Room, variables: { id: string }) => {
			queryClient.invalidateQueries({ queryKey: ['rooms'] });
			queryClient.invalidateQueries({ queryKey: ['rooms', variables.id] });
		},
	});
}

export function useDeleteRoom() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => roomsApi.delete(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['rooms'] });
		},
	});
}
