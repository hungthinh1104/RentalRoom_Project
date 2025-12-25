import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roomsApi } from './rooms-api';
import { PaginationParams } from '@/lib/api/types';
import { queryKeys } from '@/lib/api/query-keys';
import { toast } from 'sonner';

export function useRooms(params?: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.rooms.list(params),
    queryFn: () => roomsApi.getAll(params),
    staleTime: 5 * 60 * 1000, // 5 minutes (match backend cache)
  });
}

export function useRoom(id: string) {
  return useQuery({
    queryKey: queryKeys.rooms.detail(id),
    queryFn: () => roomsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: roomsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms.all });
      toast.success('Room created successfully');
    },
    onError: (error: unknown) => {
      toast.error('Failed to create room');
    },
  });
}
