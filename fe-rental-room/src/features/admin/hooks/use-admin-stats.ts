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
    propertyId: string;
    name: string;
    landlord: string;
    occupancyRate: number;
    revenue: number;
}

interface Trend {
    date: string;
    revenue: number;
    contracts: number;
}

interface DashboardStats {
    totalRevenue: number;
    occupancyRate: number;
    expiringContracts: number;
    activeUsers: number;
    totalRooms: number;
    totalProperties: number;
    trends: Trend[];
    topPerformers?: {
        landlords: TopLandlord[];
        properties: TopProperty[];
    };
}

interface BackendResponse {
    summary: {
        totalUsers: number;
        totalTenants: number;
        totalLandlords: number;
        totalProperties: number;
        totalRooms: number;
        activeContracts: number;
        platformRevenue: number;
        averageOccupancy: number;
    };
    trends: Trend[];
    topPerformers: {
        landlords: TopLandlord[];
        properties: TopProperty[];
    };
}

/**
 * Hook to fetch admin dashboard stats (client-side)
 */
export function useAdminDashboardStats() {
    return useQuery({
        queryKey: adminStatsKeys.dashboard(),
        queryFn: async () => {
            try {
                const { data } = await api.get<BackendResponse>("/reports/admin/overview");
                return {
                    totalRevenue: data.summary.platformRevenue ?? 0,
                    occupancyRate: data.summary.averageOccupancy ?? 0,
                    expiringContracts: data.summary.activeContracts ?? 0, // Backend sends active, map to this
                    activeUsers: data.summary.totalUsers ?? 0,
                    totalRooms: data.summary.totalRooms ?? 0,
                    totalProperties: data.summary.totalProperties ?? 0,
                    trends: data.trends ?? [],
                    topPerformers: data.topPerformers
                };
            } catch (error) {
                console.error("[Admin] Failed to fetch dashboard stats:", error);
                return {
                    totalRevenue: 0,
                    occupancyRate: 0,
                    expiringContracts: 0,
                    activeUsers: 0,
                    totalRooms: 0,
                    totalProperties: 0,
                    trends: [],
                    topPerformers: {
                        landlords: [],
                        properties: []
                    }
                };
            }
        },
        staleTime: 60 * 1000, // 1 minute cache
        retry: 1,
    });
}

