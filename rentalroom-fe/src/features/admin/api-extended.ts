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
const SERVER_API_BASE = API_URL.endsWith('/api/v1')
  ? API_URL
  : `${API_URL}/api/v1`;

async function serverGet<T>(path: string, params?: Record<string, unknown>): Promise<T> {
  const session = await auth();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (session?.accessToken) {
    headers["Authorization"] = `Bearer ${session.accessToken}`;
  }

  const url = new URL(`${SERVER_API_BASE}${path}`);
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

type PaginatedResponse<T> = {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages?: number };
};

const mapRoomStatus = (status?: string) => {
  switch (status) {
    case "OCCUPIED":
      return "Đã cho thuê";
    case "AVAILABLE":
      return "Trống";
    case "UNAVAILABLE":
    case "DEPOSIT_PENDING":
      return "Bảo trì";
    default:
      return "Trống";
  }
};

const mapContractStatus = (status?: string) => {
  switch (status) {
    case "ACTIVE":
      return "Hoạt động";
    case "EXPIRED":
    case "TERMINATED":
    case "CANCELLED":
      return "Hết hạn";
    default:
      return "Sắp hết hạn";
  }
};

const mapPaymentStatus = (status?: string) => {
  switch (status) {
    case "COMPLETED":
      return "Đã thanh toán";
    case "PENDING":
      return "Chưa thanh toán";
    case "FAILED":
      return "Quá hạn";
    default:
      return "Chưa thanh toán";
  }
};

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
  const raw = await serverGet<PaginatedResponse<any>>("/rooms", { page, limit });
  const mapped = (raw?.data || []).map((room) => ({
    id: room.id,
    number: room.roomNumber,
    property: room.property?.name || room.propertyId,
    status: mapRoomStatus(room.status),
    price: Number(room.pricePerMonth || 0),
    occupant: undefined,
  }));
  return z.array(adminRoomSchema).parse(mapped);
}

export async function fetchAdminContracts(page = 1, limit = 10) {
  const raw = await serverGet<PaginatedResponse<any>>("/contracts", { page, limit });
  const mapped = (raw?.data || []).map((contract) => ({
    id: contract.id,
    tenant: contract.tenant?.fullName || contract.tenantId,
    property: contract.room?.property?.name || contract.roomId,
    startDate: new Date(contract.startDate).toLocaleDateString("vi-VN"),
    endDate: new Date(contract.endDate).toLocaleDateString("vi-VN"),
    status: mapContractStatus(contract.status),
  }));
  return z.array(adminContractSchema).parse(mapped);
}

export async function fetchAdminPayments(page = 1, limit = 10) {
  const raw = await serverGet<PaginatedResponse<any>>("/payments", { page, limit });
  const mapped = (raw?.data || []).map((payment) => ({
    id: payment.id,
    tenant: payment.tenantId,
    amount: Number(payment.amount || 0),
    dueDate: payment.paidAt
      ? new Date(payment.paidAt).toLocaleDateString("vi-VN")
      : new Date(payment.paymentDate || payment.createdAt || Date.now()).toLocaleDateString("vi-VN"),
    status: mapPaymentStatus(payment.status),
  }));
  return z.array(adminPaymentSchema).parse(mapped);
}

export async function fetchAdminUsers(page = 1, limit = 10) {
  const raw = await serverGet<unknown>("/users", { page, limit });
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
  const raw = await serverGet<PaginatedResponse<any>>("/properties", params);
  const mapped = {
    items: (raw?.data || []).map((p) => ({
      id: p.id,
      name: p.name,
      address: p.address,
      landlordId: p.landlordId,
      landlordName: p.landlord?.user?.fullName || p.landlordId,
      roomCount: Number(p.totalRooms || p._count?.rooms || 0),
      createdAt: p.createdAt,
    })),
    total: raw?.meta?.total ?? 0,
    page: raw?.meta?.page ?? page,
    limit: raw?.meta?.limit ?? limit,
  };
  return paginatedPropertiesSchema.parse(mapped);
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
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
  regulations: z.array(snapshotRegulationSchema).optional().default([]),
  documentVersions: z.array(snapshotDocumentSchema).optional().default([]),
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
