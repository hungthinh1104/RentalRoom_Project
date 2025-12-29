"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api/client";

// Query keys
export const adminStatsKeys = {
    all: ["admin-stats"] as const,
    dashboard: () => [...adminStatsKeys.all, "dashboard"] as const,
};

// Types
interface DashboardStats {
    totalRevenue: number;
    occupancyRate: number;
    expiringContracts: number;
    activeUsers: number;
    totalRooms: number;
    totalProperties: number;
}

/**
 * Hook to fetch admin dashboard stats (client-side)
 */
export function useAdminDashboardStats() {
    return useQuery({
        queryKey: adminStatsKeys.dashboard(),
        queryFn: async () => {
            try {
                const { data } = await api.get<DashboardStats>("/reports/admin/overview");
                return {
                    totalRevenue: data.totalRevenue ?? 0,
                    occupancyRate: data.occupancyRate ?? 0,
                    expiringContracts: data.expiringContracts ?? 0,
                    activeUsers: data.activeUsers ?? 0,
                    totalRooms: data.totalRooms ?? 0,
                    totalProperties: data.totalProperties ?? 0,
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
                };
            }
        },
        staleTime: 60 * 1000, // 1 minute cache
        retry: 1,
    });
}
