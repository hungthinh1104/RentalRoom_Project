"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api/client";
import { z } from "zod";
import { adminUserSchema } from "@/features/admin/schemas";
import type { AdminUser } from "@/features/admin/schemas";

// Query keys for cache management
export const adminUserKeys = {
    all: ["admin-users"] as const,
    list: (params: { page?: number; search?: string; role?: string; status?: string }) =>
        [...adminUserKeys.all, "list", params] as const,
};

interface UseAdminUsersParams {
    page?: number;
    search?: string;
    role?: string;
    status?: string;
}

interface UsersResponse {
    items: AdminUser[];
    total: number;
    page: number;
    limit: number;
}

/**
 * Hook to fetch admin users with caching and filters
 * Uses React Query for optimal performance
 */
export function useAdminUsers(params: UseAdminUsersParams = {}) {
    const { page = 1, search, role, status } = params;

    return useQuery({
        queryKey: adminUserKeys.list({ page, search, role, status }),
        queryFn: async () => {
            const queryParams: Record<string, unknown> = { page, limit: 10 };
            if (search) queryParams.search = search;
            if (role) queryParams.role = role;
            if (status === "active") queryParams.emailVerified = true;
            if (status === "inactive") queryParams.emailVerified = false;

            const { data } = await api.get<UsersResponse | AdminUser[]>("/users", { params: queryParams });

            // Handle both paginated and array responses
            if (Array.isArray(data)) {
                const parsed = z.array(adminUserSchema).parse(data);
                return { items: parsed, total: parsed.length, page: 1, limit: 10 };
            }

            const parsed = z.array(adminUserSchema).parse(data.items || data);
            return { items: parsed, total: data.total || parsed.length, page: data.page || 1, limit: data.limit || 10 };
        },
        staleTime: 30 * 1000, // 30 seconds cache
        placeholderData: (prev: { items: AdminUser[]; total: number; page: number; limit: number } | undefined) => prev, // Keep previous data while loading
    });
}

interface CreateUserDto {
    email: string;
    password: string;
    fullName: string;
    role: "TENANT" | "LANDLORD" | "ADMIN";
    phoneNumber?: string;
}

/**
 * Hook to create a new user
 */
export function useCreateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreateUserDto) => {
            const { data } = await api.post<AdminUser>("/users", dto);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminUserKeys.all });
        },
    });
}

interface UpdateUserDto {
    fullName?: string;
    phoneNumber?: string;
    role?: "TENANT" | "LANDLORD" | "ADMIN";
    emailVerified?: boolean;
}

/**
 * Hook to update a user
 */
export function useUpdateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, dto }: { id: string; dto: UpdateUserDto }) => {
            const { data } = await api.patch<AdminUser>(`/users/${id}`, dto);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminUserKeys.all });
        },
    });
}

/**
 * Hook to delete a user
 */
export function useDeleteUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/users/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminUserKeys.all });
        },
    });
}

/**
 * Hook to toggle user status (activate/deactivate)
 */
export function useToggleUserStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
            const { data } = await api.patch<AdminUser>(`/users/${id}`, { emailVerified: active });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminUserKeys.all });
        },
    });
}
