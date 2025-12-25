import { z } from "zod";
import { ContractStatus } from "@/types/enums";

export const contractSchema = z.object({
  tenantId: z.string().min(1, "Tenant is required"),
  landlordId: z.string().min(1, "Landlord is required"),
  roomId: z.string().min(1, "Room is required"),
  applicationId: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  monthlyRent: z.number().positive("Monthly rent must be positive"),
  deposit: z.number().min(0, "Deposit cannot be negative"),
  terms: z.string().optional(),
});

export const contractFilterSchema = z.object({
  status: z.nativeEnum(ContractStatus).optional(),
  tenantId: z.string().optional(),
  landlordId: z.string().optional(),
  roomId: z.string().optional(),
});

export type ContractInput = z.infer<typeof contractSchema>;
export type ContractFilterInput = z.infer<typeof contractFilterSchema>;
