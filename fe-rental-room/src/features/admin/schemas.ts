import { z } from "zod";

export const adminDashboardStatsSchema = z.object({
  totalRevenue: z.number().default(0),
  occupancyRate: z.number().default(0),
  expiringContracts: z.number().default(0),
  activeUsers: z.number().default(0),
  totalRooms: z.number().default(0),
  totalProperties: z.number().default(0),
});

export type AdminDashboardStats = z.infer<typeof adminDashboardStatsSchema>;

export const adminReportsSchema = z.object({
  id: z.string(),
  month: z.string(),
  revenue: z.number(),
  occupancy: z.number(),
  activeContracts: z.number(),
});

export type AdminReport = z.infer<typeof adminReportsSchema>;

// ============ SCHEMAS FROM API-EXTENDED ============

export const adminRoomSchema = z.object({
  id: z.string(),
  number: z.string(),
  property: z.string(),
  status: z.enum(["Đã cho thuê", "Trống", "Bảo trì"]),
  price: z.number(),
  occupant: z.string().optional(),
});

export const adminContractSchema = z.object({
  id: z.string(),
  tenant: z.string(),
  property: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  status: z.enum(["Hoạt động", "Sắp hết hạn", "Hết hạn"]),
});

export const adminPaymentSchema = z.object({
  id: z.string(),
  tenant: z.string(),
  amount: z.number(),
  dueDate: z.string(),
  status: z.enum(["Đã thanh toán", "Chưa thanh toán", "Quá hạn"]),
});

export const adminUserSchema = z.object({
  id: z.string(),
  fullName: z.string().optional(),
  email: z.string(),
  role: z.enum(["TENANT", "LANDLORD", "ADMIN"]),
  emailVerified: z.boolean().optional(),
}).transform((data) => ({
  id: data.id,
  name: data.fullName || data.email.split('@')[0], // Fallback to email username
  email: data.email,
  role: data.role,
  status: data.emailVerified ? "Hoạt động" : "Vô hiệu" as "Hoạt động" | "Vô hiệu",
}));

export const ratingSchema = z.object({
  id: z.string(),
  landlordId: z.string(),
  landlordName: z.string(),
  averageRating: z.number().min(0).max(5),
  totalRatings: z.number(),
  reviewCount: z.number(),
});

export type AdminRoom = z.infer<typeof adminRoomSchema>;
export type AdminContract = z.infer<typeof adminContractSchema>;
export type AdminPayment = z.infer<typeof adminPaymentSchema>;
export type AdminUser = z.infer<typeof adminUserSchema>;
export type LandlordRating = z.infer<typeof ratingSchema>;

export const paginatedLandlordRatingSchema = z.object({
  data: z.array(ratingSchema),
  total: z.number(),
  page: z.number(),
});

export type PaginatedLandlordRating = z.infer<typeof paginatedLandlordRatingSchema>;

