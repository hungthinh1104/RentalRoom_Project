import { useQuery } from '@tanstack/react-query';
import { snapshotsApi, AuditLogParams } from '@/lib/api/snapshotsApi';

export const auditKeys = {
    all: ['audit-logs'] as const,
    list: (params: AuditLogParams) => [...auditKeys.all, 'list', params] as const,
    entity: (type: string, id: string) => [...auditKeys.all, 'entity', type, id] as const,
    verify: (id: string) => [...auditKeys.all, 'verify', id] as const,
};

export function useAuditLogs(params: AuditLogParams) {
    return useQuery({
        queryKey: auditKeys.list(params),
        queryFn: async () => {
            const { data } = await snapshotsApi.getAll(params);
            return data;
        },
        placeholderData: (previousData: any) => previousData, // Keep previous data while fetching new page
    });
}

export function useEntitySnapshots(entityType: string, entityId: string) {
    return useQuery({
        queryKey: auditKeys.entity(entityType, entityId),
        queryFn: async () => {
            const { data } = await snapshotsApi.getByEntity(entityType, entityId);
            return data;
        },
        enabled: !!entityType && !!entityId,
    });
}

export function useVerifySnapshot(id: string | null) {
    return useQuery({
        queryKey: auditKeys.verify(id || ''),
        queryFn: async () => {
            if (!id) return null;
            const { data } = await snapshotsApi.verify(id);
            return data;
        },
        enabled: !!id,
        staleTime: 0, // Always verify fresh
    });
}
