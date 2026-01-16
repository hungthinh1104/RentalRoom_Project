import api from '@/lib/api/client';
import { ContractTemplate, CreateContractTemplateDto, UpdateContractTemplateDto } from '../types/template.types';

export const templatesApi = {
    getAll: async (type?: string) => {
        return api.get<ContractTemplate[]>('/admin/contract-templates', {
            params: { type },
        });
    },

    getOne: async (id: string) => {
        return api.get<ContractTemplate>(`/admin/contract-templates/${id}`);
    },

    create: async (data: CreateContractTemplateDto) => {
        return api.post<ContractTemplate>('/admin/contract-templates', data);
    },

    update: async (id: string, data: UpdateContractTemplateDto) => {
        return api.put<ContractTemplate>(`/admin/contract-templates/${id}`, data);
    },

    preview: async (name: string) => {
        return api.get<{ pdfBase64: string }>(`/admin/contract-templates/preview/${name}`);
    },

    getHistory: async (id: string) => {
        return api.get<any[]>(`/admin/contract-templates/${id}/audit`);
    },
};
