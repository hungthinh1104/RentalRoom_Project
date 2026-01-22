import api from '@/lib/api/client';

export enum UserDocumentType {
    PCCC_CERTIFICATE = 'PCCC_CERTIFICATE',
    CONTRACT = 'CONTRACT',
    DEED = 'DEED',
    BUSINESS_LICENSE = 'BUSINESS_LICENSE',
    INVOICE = 'INVOICE',
    IDENTITY_CARD = 'IDENTITY_CARD',
    OTHER = 'OTHER',
}

export interface UserDocument {
    id: string;
    userId: string;
    propertyId?: string;
    type: UserDocumentType;
    title: string;
    fileUrl: string;
    fileHash?: string;
    expiryDate?: string;
    status: 'VALID' | 'EXPIRED' | 'PENDING_VERIFICATION' | 'REJECTED';
    description?: string;
    createdAt: string;
    property?: {
        id: string;
        name: string;
    };
}

export interface CreateDocumentDto {
    title: string;
    type: UserDocumentType;
    fileUrl: string;
    propertyId?: string;
    expiryDate?: string;
    description?: string;
}

export const documentsApi = {
    getAll: async (params?: { type?: UserDocumentType; propertyId?: string }) => {
        const { data } = await api.get<UserDocument[]>('/documents', { params });
        return data;
    },

    create: async (dto: CreateDocumentDto) => {
        const { data } = await api.post<UserDocument>('/documents', dto);
        return data;
    },

    delete: async (id: string) => {
        await api.delete(`/documents/${id}`);
    },
};

