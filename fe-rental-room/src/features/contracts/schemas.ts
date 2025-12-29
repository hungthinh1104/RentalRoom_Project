import { z } from "zod";
import { ContractStatus } from "@/types/enums";

// Resident schema for additional occupants
export const residentSchema = z.object({
  fullName: z.string().min(1, "Vui lòng nhập họ tên"),
  citizenId: z.string().optional(),
  relationship: z.enum(["SPOUSE", "CHILD", "PARENT", "FRIEND", "OTHER"]),
  phoneNumber: z.string().optional(),
});

export const contractSchema = z.object({
  // Parties
  tenantId: z.string().min(1, "Vui lòng chọn người thuê"),
  landlordId: z.string().min(1, "Chủ nhà không hợp lệ"),
  roomId: z.string().min(1, "Vui lòng chọn phòng"),
  applicationId: z.string().optional(),

  // Dates
  startDate: z.string().min(1, "Vui lòng chọn ngày bắt đầu"),
  endDate: z.string().min(1, "Vui lòng chọn ngày kết thúc"),

  // Financial
  monthlyRent: z.number().positive("Giá thuê phải lớn hơn 0"),
  deposit: z.number().min(0, "Tiền cọc không được âm"),
  paymentDay: z.number().min(1).max(31),

  // Residents
  residents: z.array(residentSchema),
  maxOccupants: z.number().min(1),

  // Legal
  terms: z.string().optional(),
}).refine((data) => new Date(data.endDate) > new Date(data.startDate), {
  message: "Ngày kết thúc phải sau ngày bắt đầu",
  path: ["endDate"],
}).refine((data) => {
  // Validate total occupants (tenant + residents) <= maxOccupants
  const totalOccupants = 1 + (data.residents?.length || 0);
  return totalOccupants <= data.maxOccupants;
}, {
  message: "Tổng số người ở vượt quá giới hạn",
  path: ["residents"],
});

export const contractFilterSchema = z.object({
  status: z.nativeEnum(ContractStatus).optional(),
  tenantId: z.string().optional(),
  landlordId: z.string().optional(),
  roomId: z.string().optional(),
});

export type ContractInput = z.infer<typeof contractSchema>;
export type ResidentInput = z.infer<typeof residentSchema>;
export type ContractFilterInput = z.infer<typeof contractFilterSchema>;
