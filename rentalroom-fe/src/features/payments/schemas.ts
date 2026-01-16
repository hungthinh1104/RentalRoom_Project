import { z } from "zod";
import { PaymentMethod } from "@/types/enums";

export const paymentSchema = z.object({
  invoiceId: z.string().min(1, "Invoice is required"),
  tenantId: z.string().min(1, "Tenant is required"),
  amount: z.number().positive("Amount must be positive"),
  paymentMethod: z.nativeEnum(PaymentMethod),
  paymentDate: z.string().min(1, "Payment date is required"),
  transactionId: z.string().optional(),
  notes: z.string().optional(),
});

export const paymentFilterSchema = z.object({
  tenantId: z.string().optional(),
  invoiceId: z.string().optional(),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type PaymentInput = z.infer<typeof paymentSchema>;
export type PaymentFilterInput = z.infer<typeof paymentFilterSchema>;
