"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api/client";

// Query keys
export const adminStatsKeys = {
    all: ["admin-stats"] as const,
    dashboard: () => [...adminStatsKeys.all, "dashboard"] as const,
};

// Types
interface TopLandlord {
    landlordId: string;
    name: string;
    properties: number;
    revenue: number;
    occupancyRate: number;
}

interface TopProperty {
    propertyId: string; // or id
    id?: string;
    name: string;
    landlord?: string; // name
    revenue: number;
    occupiedRooms?: number;
    rooms?: number;
    occupancyRate: number;
}

interface Trend {
    date: string;
    revenue: number;
    // contracts: number; // Removed from backend response
}

// Backend API Response Shape
interface AdminOverviewResponse {
    totalRevenue: number;
    occupancyRate: number;
    expiringContracts: number;
    activeUsers: number;
    totalRooms: number;
    trends: Trend[];
    // Top performers are fetched separately or included? 
    // My backend controller separates them. 
    // Hook implementation combines them? 
    // The previous hook seemed to mock activeUsers etc from 'summary'.
    // Let's separate top performers fetch if needed or just use overview for now.
}

/**
 * Hook to fetch admin dashboard stats (client-side)
 */
export function useAdminDashboardStats() {
    // 1. Overview Query
    const overviewQuery = useQuery({
        queryKey: adminStatsKeys.dashboard(),
        queryFn: async () => {
            // Correct Endpoint: /api/v1/dashboard/admin/overview
            // Assuming api client has baseURL configured or we leverage relative path if proxied
            const { data } = await api.get<AdminOverviewResponse>("/dashboard/admin/overview");
            return data;
        },
        staleTime: 60 * 1000,
    });

    // 2. Top Performers Query
    const topPerformersQuery = useQuery({
        queryKey: [...adminStatsKeys.all, "top-performers"],
        queryFn: async () => {
            const { data } = await api.get<{ landlords: TopLandlord[]; properties: TopProperty[] }>("/dashboard/admin/top-performers");
            return data;
        },
        staleTime: 60 * 1000,
    });

    // Combine results
    const isLoading = overviewQuery.isLoading || topPerformersQuery.isLoading;
    const error = overviewQuery.error || topPerformersQuery.error;

    return {
        data: {
            totalRevenue: overviewQuery.data?.totalRevenue ?? 0,
            occupancyRate: overviewQuery.data?.occupancyRate ?? 0,
            expiringContracts: overviewQuery.data?.expiringContracts ?? 0,
            activeUsers: overviewQuery.data?.activeUsers ?? 0,
            totalRooms: overviewQuery.data?.totalRooms ?? 0,
            // totalProperties not in overview response yet, safe to omit or 0
            totalProperties: 0,
            trends: overviewQuery.data?.trends ?? [],
            topPerformers: topPerformersQuery.data
        },
        isLoading,
        error
    };
}

