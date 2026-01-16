"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api/client";

// Query keys
export const adminPropertyKeys = {
    all: ["admin-properties"] as const,
    list: (params?: { page?: number; search?: string }) =>
        [...adminPropertyKeys.all, "list", params] as const,
};

export const adminRoomKeys = {
    all: ["admin-rooms"] as const,
    list: (params?: { page?: number; search?: string; status?: string; propertyId?: string }) =>
        [...adminRoomKeys.all, "list", params] as const,
};

// Types
export interface Property {
    id: string;
    name: string;
    address: string;
    city?: string;
    district?: string;
    ward?: string;
    landlordName: string;
    landlordId: string;
    roomCount: number;
    createdAt: string;
}

export interface Room {
    id: string;
    roomNumber: string;
    propertyName: string;
    propertyId: string;
    status: string;
    price: number;
    area?: number;
    tenantName?: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
}

interface BackendPaginatedResponse<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

/**
 * Hook to fetch all properties (admin view)
 */
export function useAdminProperties(params: { page?: number; search?: string } = {}) {
    const { page = 1, search } = params;

    return useQuery({
        queryKey: adminPropertyKeys.list({ page, search }),
        queryFn: async () => {
            const queryParams: Record<string, unknown> = { page, limit: 10 };
            if (search) queryParams.search = search;

            const { data } = await api.get<Property[] | BackendPaginatedResponse<Property>>("/properties", { params: queryParams });

            // Normalize response
            if (Array.isArray(data)) {
                return {
                    items: data.map(normalizeProperty),
                    total: data.length,
                    page: 1,
                    limit: 10
                };
            }

            return {
                items: (data.data || []).map(normalizeProperty),
                total: data.meta?.total || 0,
                page: data.meta?.page || 1,
                limit: data.meta?.limit || 10,
            };
        },
        staleTime: 30 * 1000,
        placeholderData: (prev: PaginatedResponse<Property> | undefined) => prev,
    });
}

/**
 * Hook to fetch all rooms (admin view)
 */
export function useAdminRooms(params: { page?: number; search?: string; status?: string; propertyId?: string } = {}) {
    const { page = 1, search, status, propertyId } = params;

    return useQuery({
        queryKey: adminRoomKeys.list({ page, search, status, propertyId }),
        queryFn: async () => {
            const queryParams: Record<string, unknown> = { page, limit: 10 };
            if (search) queryParams.search = search;
            if (status) queryParams.status = status;
            if (propertyId) queryParams.propertyId = propertyId;

            const { data } = await api.get<Room[] | BackendPaginatedResponse<Room>>("/rooms", { params: queryParams });

            if (Array.isArray(data)) {
                return {
                    items: data.map(normalizeRoom),
                    total: data.length,
                    page: 1,
                    limit: 10
                };
            }

            return {
                items: (data.data || []).map(normalizeRoom),
                total: data.meta?.total || 0,
                page: data.meta?.page || 1,
                limit: data.meta?.limit || 10,
            };
        },
        staleTime: 30 * 1000,
        placeholderData: (prev: PaginatedResponse<Room> | undefined) => prev,
    });
}

/**
 * Hook to update room status
 */
export function useUpdateRoomStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ roomId, status }: { roomId: string; status: string }) => {
            const { data } = await api.patch(`/rooms/${roomId}`, { status });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminRoomKeys.all });
        },
    });
}

/**
 * Hook to delete a property (admin only)
 */
export function useDeleteProperty() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (propertyId: string) => {
            await api.delete(`/properties/${propertyId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminPropertyKeys.all });
            queryClient.invalidateQueries({ queryKey: adminRoomKeys.all });
        },
    });
}

// Normalize functions to handle different API response formats
function normalizeProperty(p: any): Property {
    return {
        id: p.id,
        name: p.name || p.propertyName || "Chưa đặt tên",
        address: p.address || [p.street, p.ward, p.district, p.city].filter(Boolean).join(", ") || "Chưa có địa chỉ",
        city: p.city,
        district: p.district,
        ward: p.ward,
        landlordName: p.landlord?.user?.fullName || p.landlordName || "Không xác định",
        landlordId: p.landlordId || p.landlord?.id || "",
        roomCount: p._count?.rooms || p.roomCount || 0,
        createdAt: p.createdAt,
    };
}

function normalizeRoom(r: any): Room {
    return {
        id: r.id,
        roomNumber: r.roomNumber || r.number || "N/A",
        propertyName: r.property?.name || r.propertyName || r.property || "N/A",
        propertyId: r.propertyId || r.property?.id || "",
        status: r.status || "AVAILABLE",
        price: r.price || r.rentPrice || 0,
        area: r.area,
        tenantName: r.contracts?.[0]?.tenant?.user?.fullName || r.tenantName || r.occupant,
    };
}
