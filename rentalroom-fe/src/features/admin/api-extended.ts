import { auth } from "@/auth";
import { z } from "zod";
import {
  adminDashboardStatsSchema,
  adminRoomSchema,
  adminContractSchema,
  adminPaymentSchema,
  adminUserSchema,
} from "./schemas";

import { config } from "@/lib/config";

const API_URL = config.api.url;

async function serverGet<T>(path: string, params?: Record<string, unknown>): Promise<T> {
  const session = await auth();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (session?.accessToken) {
    headers["Authorization"] = `Bearer ${session.accessToken}`;
  }

  const url = new URL(`${API_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) url.searchParams.append(key, String(value));
    });
  }

  const res = await fetch(url.toString(), {
    method: "GET",
    headers,
    cache: "no-store",
    credentials: "include",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${path} failed (${res.status}): ${body}`);
  }
  return res.json() as Promise<T>;
}

// Zod schemas for server responses
const trendSchema = z.object({ date: z.string(), revenue: z.number() });
export const adminOverviewSchema = z.object({
  totalRevenue: z.number().default(0),
  occupancyRate: z.number().default(0),
  expiringContracts: z.number().default(0),
  activeUsers: z.number().default(0),
  totalRooms: z.number().default(0),
  trends: z.array(trendSchema).default([]),
});

const topLandlordSchema = z.object({
  landlordId: z.string(),
  name: z.string(),
  properties: z.number(),
  revenue: z.number(),
  occupancyRate: z.number(),
});

const topPropertySchema = z.object({
  propertyId: z.string().optional(),
  id: z.string().optional(),
  name: z.string(),
  landlord: z.string().optional(),
  revenue: z.number(),
  occupiedRooms: z.number().optional(),
  rooms: z.number().optional(),
  occupancyRate: z.number(),
});

const topPerformersSchema = z.object({
  landlords: z.array(topLandlordSchema),
  properties: z.array(topPropertySchema),
});

export type AdminOverview = z.infer<typeof adminOverviewSchema>;
export type TopPerformers = z.infer<typeof topPerformersSchema>;

// Server-side fetchers
export async function fetchAdminOverview(): Promise<AdminOverview> {
  const raw = await serverGet<unknown>("/dashboard/admin/overview");
  return adminOverviewSchema.parse(raw);
}

export async function fetchAdminTopPerformers(): Promise<TopPerformers> {
  const raw = await serverGet<unknown>("/dashboard/admin/top-performers");
  return topPerformersSchema.parse(raw);
}

export async function fetchAdminRooms(page = 1, limit = 10) {
  const raw = await serverGet<unknown>("/admin/rooms", { page, limit });
  return z.array(adminRoomSchema).parse(raw);
}

export async function fetchAdminContracts(page = 1, limit = 10) {
  const raw = await serverGet<unknown>("/admin/contracts", { page, limit });
  return z.array(adminContractSchema).parse(raw);
}

export async function fetchAdminPayments(page = 1, limit = 10) {
  const raw = await serverGet<unknown>("/admin/payments", { page, limit });
  return z.array(adminPaymentSchema).parse(raw);
}

export async function fetchAdminUsers(page = 1, limit = 10) {
  const raw = await serverGet<unknown>("/admin/users", { page, limit });
  return z.array(adminUserSchema).parse(raw);
}

// Properties schema and fetcher
const adminPropertySchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string(),
  landlordId: z.string(),
  landlordName: z.string(),
  roomCount: z.number(),
  createdAt: z.string(),
});

const paginatedPropertiesSchema = z.object({
  items: z.array(adminPropertySchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});

export type AdminProperty = z.infer<typeof adminPropertySchema>;
export type PaginatedProperties = z.infer<typeof paginatedPropertiesSchema>;

export async function fetchAdminProperties(page = 1, limit = 50, search?: string): Promise<PaginatedProperties> {
  const params: Record<string, unknown> = { page, limit };
  if (search) params.search = search;
  const raw = await serverGet<unknown>("/admin/properties", params);
  return paginatedPropertiesSchema.parse(raw);
}

// Audit logs schema and fetcher
const snapshotRegulationSchema = z.object({
  type: z.string(),
  version: z.string(),
  hash: z.string(),
});

const snapshotDocumentSchema = z.object({
  type: z.string(),
  version: z.string(),
  hash: z.string(),
});

const auditLogSchema = z.object({
  id: z.string(),
  actorId: z.string(),
  actorRole: z.string(),
  actionType: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  timestamp: z.string(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  dataHash: z.string(),
  metadata: z.record(z.string(), z.unknown()),
  regulations: z.array(snapshotRegulationSchema),
  documentVersions: z.array(snapshotDocumentSchema),
});

const paginatedAuditLogsSchema = z.object({
  data: z.array(auditLogSchema),
  meta: z.object({
    total: z.number(),
    page: z.number(),
    lastPage: z.number(),
  }),
});

export type AuditLog = z.infer<typeof auditLogSchema>;
export type PaginatedAuditLogs = z.infer<typeof paginatedAuditLogsSchema>;

export async function fetchAuditLogs(
  page = 1,
  limit = 20,
  actionType?: string,
  entityType?: string
): Promise<PaginatedAuditLogs> {
  const params: Record<string, unknown> = { page, limit };
  if (actionType) params.actionType = actionType;
  if (entityType) params.entityType = entityType;
  const raw = await serverGet<unknown>("/admin/snapshots", params);
  return paginatedAuditLogsSchema.parse(raw);
}

// PCCC Reports schema and fetcher
const pcccReportSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  complianceScore: z.number(),
  status: z.string(),
  property: z.object({
    name: z.string(),
    address: z.string(),
    landlord: z.object({
      user: z.object({
        fullName: z.string(),
        email: z.string(),
      }),
    }),
  }),
});

export type PCCCReport = z.infer<typeof pcccReportSchema>;

export async function fetchPCCCReports(): Promise<PCCCReport[]> {
  const raw = await serverGet<unknown>("/pccc/admin/reports");
  return z.array(pcccReportSchema).parse(raw);
}
