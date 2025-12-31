import api from "@/lib/api/client";
import { PaginationParams, PaginatedResponse } from "@/types";

export enum ServiceType {
    ELECTRICITY = "ELECTRICITY",
    WATER = "WATER",
    INTERNET = "INTERNET",
    PARKING = "PARKING",
    CLEANING = "CLEANING",
    OTHER = "OTHER",
}

export enum BillingMethod {
    FIXED = "FIXED",
    METERED = "METERED",
}

export interface Service {
    id: string;
    propertyId: string;
    serviceName: string;
    serviceType: ServiceType;
    billingMethod: BillingMethod;
    unitPrice: number;
    unit?: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateServiceDto {
    propertyId: string;
    serviceName: string;
    serviceType: ServiceType;
    billingMethod: BillingMethod;
    unitPrice: number;
    unit?: string;
    description?: string;
}

export interface UpdateServiceDto extends Partial<CreateServiceDto> { }

export interface FilterServicesParams extends PaginationParams, Record<string, any> {
    propertyId?: string;
    serviceType?: ServiceType;
    billingMethod?: BillingMethod;
    search?: string;
}

export const servicesApi = {
    getServices: async (params?: FilterServicesParams): Promise<PaginatedResponse<Service>> => {
        const { data } = await api.get<PaginatedResponse<Service>>("/services", { params });
        return data;
    },

    getServiceById: async (id: string): Promise<Service> => {
        const { data } = await api.get<Service>(`/services/${id}`);
        return data;
    },

    createService: async (dto: CreateServiceDto): Promise<Service> => {
        const { data } = await api.post<Service>("/services", dto);
        return data;
    },

    updateService: async (id: string, dto: UpdateServiceDto): Promise<Service> => {
        const { data } = await api.patch<Service>(`/services/${id}`, dto);
        return data;
    },

    deleteService: async (id: string): Promise<void> => {
        await api.delete(`/services/${id}`);
    },
};
