import { z } from "zod";
import { PropertyType } from "@/types/enums";

export const propertySchema = z.object({
  landlordId: z.string().min(1, "Landlord is required"),
  name: z.string().min(2, "Property name must be at least 2 characters"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(2, "City is required"),
  district: z.string().min(2, "District is required"),
  propertyType: z.nativeEnum(PropertyType),
  description: z.string().optional(),
});

export const propertyFilterSchema = z.object({
  city: z.string().optional(),
  district: z.string().optional(),
  propertyType: z.nativeEnum(PropertyType).optional(),
  search: z.string().optional(),
});

export type PropertyInput = z.infer<typeof propertySchema>;
export type PropertyFilterInput = z.infer<typeof propertyFilterSchema>;
