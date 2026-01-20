import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { servicesApi, FilterServicesParams, CreateServiceDto, UpdateServiceDto, Service } from "./services-api";

export const serviceKeys = {
    all: ["services"] as const,
    lists: () => [...serviceKeys.all, "list"] as const,
    list: (params: FilterServicesParams) => [...serviceKeys.lists(), params] as const,
    details: () => [...serviceKeys.all, "detail"] as const,
    detail: (id: string) => [...serviceKeys.details(), id] as const,
};

export function useServices(params?: FilterServicesParams) {
    return useQuery({
        queryKey: serviceKeys.list(params || {}),
        queryFn: () => servicesApi.getServices(params),
    });
}

export function useService(id: string) {
    return useQuery({
        queryKey: serviceKeys.detail(id),
        queryFn: () => servicesApi.getServiceById(id),
        enabled: !!id,
    });
}

export function useCreateService() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (dto: CreateServiceDto) => servicesApi.createService(dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
        },
    });
}

export function useUpdateService() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, dto }: { id: string; dto: UpdateServiceDto }) =>
            servicesApi.updateService(id, dto),
        onSuccess: (data: Service) => {
            queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
            queryClient.invalidateQueries({ queryKey: serviceKeys.detail(data.id) });
        },
    });
}

export function useDeleteService() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => servicesApi.deleteService(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
        },
    });
}
