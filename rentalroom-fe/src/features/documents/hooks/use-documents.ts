import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { documentsApi, CreateDocumentDto, UserDocumentType } from '../api/documents-api';
import { toast } from 'sonner';

export const documentKeys = {
    all: ['documents'] as const,
    list: (params?: { type?: UserDocumentType; propertyId?: string }) => [...documentKeys.all, 'list', params] as const,
};

export function useDocuments(params?: { type?: UserDocumentType; propertyId?: string }) {
    return useQuery({
        queryKey: documentKeys.list(params),
        queryFn: () => documentsApi.getAll(params),
    });
}

export function useCreateDocument() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (dto: CreateDocumentDto) => documentsApi.create(dto),
        onSuccess: () => {
            toast.success("Tải tài liệu lên thành công");
            queryClient.invalidateQueries({ queryKey: documentKeys.all });
        },
        onError: () => {
            toast.error("Có lỗi xảy ra khi tải tài liệu");
        },
    });
}

export function useDeleteDocument() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => documentsApi.delete(id),
        onSuccess: () => {
            toast.success("Đã xóa tài liệu");
            queryClient.invalidateQueries({ queryKey: documentKeys.all });
        },
        onError: () => {
            toast.error("Không thể xóa tài liệu");
        },
    });
}
