import api from "@/lib/api/client";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
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

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? "http://localhost:3001";
const API_PREFIX = "/api/v1";

type SessionWithToken = Session & { accessToken?: string };

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
  const session = await getServerSession(authOptions);
  const accessToken = (session as SessionWithToken)?.accessToken;
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
    const data = await fetchWithAuth<AdminDashboardStats>("/reports/admin/overview");
    return adminDashboardStatsSchema.parse(data);
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
 * NOTE: Backend currently doesn't have a generic /admin/reports endpoint.
 * Mapping to /reports/admin/overview for now or leaving empty until backend is ready.
 * For this fix, we'll return empty array to prevent errors until backend implements it.
 */
export async function fetchAdminReports(): Promise<AdminReport[]> {
  try {
    // Placeholder: Generic report endpoint doesn't exist yet.
    // Could potentially use /reports/admin/market-insights if schema matches?
    // For now, return empty to avoid 404s.
    return [];
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

/**
 * Fetch market insights
 * Endpoint: /reports/admin/market-insights
 */
export async function fetchAdminMarketInsights(): Promise<unknown> {
  try {
    const data = await fetchWithAuth<unknown>("/reports/admin/market-insights");
    return data;
  } catch (error) {
    console.error("[Admin] Failed to fetch market insights:", error);
    return null;
  }
}


