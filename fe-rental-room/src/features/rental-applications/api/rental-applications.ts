import api from "@/lib/api/client";
import { type RentalApplication, type PaginationParams, type PaginatedResponse } from "@/types";

const BASE_URL = "/contracts/applications";

export const rentalApplicationsApi = {
    getAll: async (params?: PaginationParams & { tenantId?: string; landlordId?: string; status?: string }) => {
        // api.get returns { data: T }
        const { data } = await api.get<PaginatedResponse<RentalApplication>>(BASE_URL, { params });
        return data;
    },

    getOne: async (id: string) => {
        const { data } = await api.get<RentalApplication>(`${BASE_URL}/${id}`);
        return data;
    },

    approve: async (id: string) => {
        const { data } = await api.patch<RentalApplication>(`${BASE_URL}/${id}/approve`);
        return data;
    },

    reject: async (id: string, reason?: string) => {
        const { data } = await api.patch<RentalApplication>(`${BASE_URL}/${id}/reject`, { rejectionReason: reason });
        return data;
    },

    withdraw: async (id: string) => {
        const { data } = await api.patch<RentalApplication>(`${BASE_URL}/${id}/withdraw`);
        return data;
    },
};
