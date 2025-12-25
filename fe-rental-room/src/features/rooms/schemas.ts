import { z } from "zod";
import { RoomStatus } from "@/types/enums";

export const roomSchema = z.object({
  propertyId: z.string().min(1, "Property is required"),
  roomNumber: z.string().min(1, "Room number is required"),
  area: z.number().positive("Area must be positive"),
  pricePerMonth: z.number().positive("Price must be positive"),
  deposit: z.number().min(0, "Deposit cannot be negative"),
  maxOccupants: z.number().int().positive("Max occupants must be positive").optional(),
  status: z.nativeEnum(RoomStatus).optional().default(RoomStatus.AVAILABLE),
  description: z.string().optional(),
});

export const roomFilterSchema = z.object({
  propertyId: z.string().optional(),
  status: z.nativeEnum(RoomStatus).optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  minArea: z.coerce.number().optional(),
  maxArea: z.coerce.number().optional(),
  search: z.string().optional(),
  sortBy: z.enum(["price", "area", "newest", "rating"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  amenities: z.array(z.string()).optional(),
});

export type RoomInput = z.infer<typeof roomSchema>;
export type RoomFilterInput = z.infer<typeof roomFilterSchema>;
