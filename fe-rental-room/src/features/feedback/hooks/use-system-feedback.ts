import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { systemFeedbackApi } from '../api';
import type { CreateSystemFeedbackDto, UpdateFeedbackStatusDto } from '../types';
import { toast } from 'sonner';

export function useSystemFeedback() {
    const queryClient = useQueryClient();

    const submitMutation = useMutation({
        mutationFn: (data: CreateSystemFeedbackDto) => systemFeedbackApi.submit(data),
        onSuccess: () => {
            toast.success('Gửi phản hồi thành công!');
            queryClient.invalidateQueries({ queryKey: ['feedback'] });
        },
        onError: () => {
            toast.error('Không thể gửi phản hồi. Vui lòng thử lại.');
        },
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateFeedbackStatusDto }) =>
            systemFeedbackApi.updateStatus(id, data),
        onSuccess: () => {
            toast.success('Cập nhật trạng thái thành công!');
            queryClient.invalidateQueries({ queryKey: ['feedback'] });
        },
        onError: () => {
            toast.error('Không thể cập nhật trạng thái.');
        },
    });

    return {
        submitFeedback: submitMutation.mutate,
        updateStatus: updateStatusMutation.mutate,
        isSubmitting: submitMutation.isPending,
        isUpdating: updateStatusMutation.isPending,
    };
}

export function useAdminFeedback(params?: {
    status?: string;
    type?: string;
    page?: number;
    limit?: number;
}) {
    return useQuery({
        queryKey: ['feedback', 'admin', params],
        queryFn: () => systemFeedbackApi.getAll(params),
    });
}
