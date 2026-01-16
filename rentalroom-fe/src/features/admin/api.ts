import api from "@/lib/api/client";
import { auth } from "@/auth";
import type { Session } from "next-auth";
import { z } from "zod";
import {
  adminDashboardStatsSchema,
  adminRoomSchema,
  adminContractSchema,
  adminPaymentSchema,
  adminUserSchema,
  paginatedLandlordRatingSchema,
} from "./schemas";
import type {
  AdminDashboardStats,
  AdminReport,
  AdminRoom,
  AdminContract,
  AdminPayment,
  AdminUser,
  PaginatedLandlordRating,
} from "./schemas";

// ============ SSR-COMPATIBLE API HELPERS ============

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? "http://localhost:3000";
const API_PREFIX = "/api/v1";

function buildUrl(path: string, params?: Record<string, string | number | undefined>) {
  const url = new URL(`${API_BASE}${API_PREFIX}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
}

/**
 * Server-side fetch with authentication from NextAuth session
 * Use this for SSR pages that need authenticated API calls
 */
async function fetchWithAuth<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const session = await auth();
  const accessToken = session?.accessToken;
  if (!accessToken) {
    throw new Error("Unauthorized: missing access token");
  }

  const res = await fetch(buildUrl(path, params), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body || res.statusText}`);
  }

  return res.json() as Promise<T>;
}

// ============ API FETCHERS ============

/**
 * Fetch admin dashboard stats (SSR-compatible)
 * Endpoint: /reports/admin/overview
 */
export async function fetchAdminDashboardStats(): Promise<AdminDashboardStats> {
  try {
    const data = await fetchWithAuth<{
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
    }>("/reports/admin/overview");

    // Transform nested summary to flat AdminDashboardStats
    return adminDashboardStatsSchema.parse({
      totalRevenue: data.summary.platformRevenue ?? 0,
      occupancyRate: data.summary.averageOccupancy ?? 0,
      expiringContracts: data.summary.activeContracts ?? 0, // Approximation
      activeUsers: data.summary.totalUsers ?? 0,
      totalRooms: data.summary.totalRooms ?? 0,
      totalProperties: data.summary.totalProperties ?? 0,
    });
  } catch (error) {
    console.error("[Admin] Failed to fetch dashboard stats:", error);
    // Return default stats on error
    return {
      totalRevenue: 0,
      occupancyRate: 0,
      expiringContracts: 0,
      activeUsers: 0,
      totalRooms: 0,
      totalProperties: 0,
    };
  }
}

/**
 * Fetch admin reports with pagination
 * Maps to /reports/admin/overview and extracts trends data
 */
export async function fetchAdminReports(): Promise<AdminReport[]> {
  try {
    const data = await fetchWithAuth<{
      trends: Array<{
        period: string;
        totalRevenue: number;
        averageOccupancy: number;
        activeContracts: number;
      }>;
    }>("/reports/admin/overview", { period: "monthly", periods: 6 });

    // Transform trends to AdminReport format
    return data.trends.map((trend, index) => ({
      id: `report-${index}`,
      month: trend.period,
      revenue: trend.totalRevenue,
      occupancy: trend.averageOccupancy,
      activeContracts: trend.activeContracts,
    }));
  } catch (error) {
    console.error("[Admin] Failed to fetch reports:", error);
    return [];
  }
}

export async function fetchAdminRooms(page = 1): Promise<AdminRoom[]> {
  try {
    const data = await fetchWithAuth<AdminRoom[]>("/rooms", { page, limit: 10 });
    return z.array(adminRoomSchema).parse(data);
  } catch (error) {
    console.error("[Admin] Failed to fetch rooms:", error);
    return [];
  }
}

export async function fetchAdminContracts(page = 1): Promise<AdminContract[]> {
  try {
    const data = await fetchWithAuth<AdminContract[]>("/contracts", { page, limit: 10 });
    return z.array(adminContractSchema).parse(data);
  } catch (error) {
    console.error("[Admin] Failed to fetch contracts:", error);
    return [];
  }
}

export async function fetchAdminPayments(page = 1): Promise<AdminPayment[]> {
  try {
    const data = await fetchWithAuth<AdminPayment[]>("/payments", { page, limit: 10 });
    return z.array(adminPaymentSchema).parse(data);
  } catch (error) {
    console.error("[Admin] Failed to fetch payments:", error);
    return [];
  }
}

/**
 * Fetch admin users (SSR version - for Server Components)
 */
export async function fetchAdminUsers(page = 1): Promise<AdminUser[]> {
  try {
    const data = await fetchWithAuth<AdminUser[]>("/users", { page, limit: 10 });
    return z.array(adminUserSchema).parse(data);
  } catch (error) {
    console.error("[Admin] Failed to fetch users:", error);
    return [];
  }
}

/**
 * Fetch admin users (Client version - for Client Components)
 * Use this in useEffect or client-side code
 */
export async function fetchAdminUsersClient(page = 1): Promise<AdminUser[]> {
  try {
    const { data } = await api.get<AdminUser[]>("/users", { params: { page, limit: 10 } });
    return z.array(adminUserSchema).parse(data);
  } catch (error) {
    console.error("[Admin] Failed to fetch users (client):", error);
    return [];
  }
}

/**
 * Fetch landlord ratings and reviews for admin reporting
 */
export async function fetchLandlordRatings(
  page = 1,
  limit = 10,
  search?: string
): Promise<PaginatedLandlordRating> {
  try {
    const data = await fetchWithAuth<PaginatedLandlordRating>("/reports/admin/ratings", { page, limit, search });
    return paginatedLandlordRatingSchema.parse(data);
  } catch (error) {
    console.error("[Admin] Failed to fetch ratings:", error);
    return { data: [], total: 0, page: 1 };
  }
}

// Types for Market Insights
export interface AdminMarketInsights {
  priceAnalysis: Array<{
    propertyType: string;
    city: string;
    ward: string;
    averagePrice: number;
    minPrice: number;
    maxPrice: number;
    totalListings: number;
    occupancyRate: number;
  }>;
  popularSearches: Array<{
    query: string;
    searchCount: number;
    lastSearched: string;
  }>;
  demandMetrics: {
    totalSearches: number;
    totalApplications: number;
    conversionRate: number;
    averageTimeToBook: number;
  };
  recommendations: string[];
}

/**
 * Fetch market insights
 * Endpoint: /reports/admin/market-insights
 */
export async function fetchAdminMarketInsights(): Promise<AdminMarketInsights | null> {
  try {
    const data = await fetchWithAuth<AdminMarketInsights>("/reports/admin/market-insights", {
      city: "Ho Chi Minh", // Default city
    });
    return data;
  } catch (error) {
    console.error("[Admin] Failed to fetch market insights:", error);
    return null;
  }
}


