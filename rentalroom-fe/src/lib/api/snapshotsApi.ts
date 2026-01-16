import api from './client';

export interface AuditLogParams {
    page?: number;
    limit?: number;
    actionType?: string;
    entityType?: string;
    actorId?: string;
    startDate?: string;
    endDate?: string;
}

export interface Snapshot {
    id: string;
    actorId: string;
    actorRole: string;
    actionType: string;
    entityType: string;
    entityId: string;
    timestamp: string;
    ipAddress?: string;
    userAgent?: string;
    dataHash: string;
    metadata: Record<string, any>;
    regulations: any[];
    documentVersions: any[];
}

export interface VerifyResponse {
    id: string;
    isValid: boolean;
    timestamp: string;
}

export interface SnapshotsListResponse {
    data: Snapshot[];
    meta: {
        total: number;
        page: number;
        lastPage: number;
    };
}

export const snapshotsApi = {
    getAll: (params: AuditLogParams) =>
        api.get<SnapshotsListResponse>('/admin/snapshots', { params: params as Record<string, unknown> }),

    getByEntity: (entityType: string, entityId: string) =>
        api.get<Snapshot[]>(`/admin/snapshots/entity/${entityType}/${entityId}`),

    verify: (id: string) =>
        api.get<VerifyResponse>(`/admin/snapshots/${id}/verify`),
};
