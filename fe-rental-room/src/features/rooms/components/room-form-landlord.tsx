"use client";

import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RoomStatus } from "@/types/enums";
import { roomSchema, type RoomInput } from "../schemas";
import { DoorOpen, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { RoomBasicInfo } from "./form/room-basic-info";
import { RoomDetails } from "./form/room-details";
import { RoomAmenities } from "./form/room-amenities";
import { RoomImages } from "./form/room-images";

interface RoomFormProps {
  defaultValues?: Partial<RoomInput>;
  onSubmit: (data: RoomInput) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  isEdit?: boolean;
  propertyId: string;
  propertyName?: string;
  hideHeader?: boolean;
}

export function RoomForm({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading = false,
  isEdit = false,
  propertyId,
  propertyName,
  hideHeader = false,
}: RoomFormProps) {
  const form = useForm<RoomInput>({
    resolver: zodResolver(roomSchema) as Resolver<RoomInput>,
    defaultValues: {
      propertyId,
      roomNumber: "",
      area: 0,
      pricePerMonth: 0,
      deposit: 0,
      maxOccupants: undefined,
      status: RoomStatus.AVAILABLE,
      description: "",
      amenities: [],
      images: [],
      ...defaultValues,
    } as RoomInput,
  });

  const { handleSubmit, reset } = form;

  // Reset form when defaultValues change (e.g. switching from Add to Edit or changing rooms)
  useEffect(() => {
    if (defaultValues) {
      reset({
        propertyId,
        roomNumber: "",
        area: 0,
        pricePerMonth: 0,
        deposit: 0,
        maxOccupants: undefined,
        status: RoomStatus.AVAILABLE,
        description: "",
        amenities: [],
        images: [],
        ...defaultValues,
      });
    } else {
      // Reset to default empty state for "Add" mode
      reset({
        propertyId,
        roomNumber: "",
        area: 0,
        pricePerMonth: 0,
        deposit: 0,
        maxOccupants: undefined,
        status: RoomStatus.AVAILABLE,
        description: "",
        amenities: [],
        images: [],
      });
    }
  }, [defaultValues, propertyId, reset]);

  const handleSubmitForm = async (data: RoomInput) => {
    // Ensure data types match expectations before sending
    const formattedData = {
      ...data,
      // Ensure specific fields are correctly typed if needed
    };
    await onSubmit(formattedData);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("mx-auto", !hideHeader && "max-w-2xl")}
    >
      {/* Header */}
      {!hideHeader && (
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <DoorOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {isEdit ? "Chỉnh sửa phòng" : "Thêm phòng mới"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isEdit
                  ? "Cập nhật thông tin phòng"
                  : "Điền đầy đủ thông tin để thêm phòng mới"}
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(handleSubmitForm, (errors) => console.error("Form validation errors:", errors))} className="space-y-6">
        {/* Hidden Fields */}
        <input type="hidden" {...form.register("propertyId")} />

        {/* 1. Basic Info (Price, Number) */}
        <RoomBasicInfo form={form} isLoading={isLoading} />

        {/* 2. Details (Area, Occupants, Status) */}
        <RoomDetails form={form} isLoading={isLoading} defaultStatus={defaultValues?.status} />

        {/* 3. Amenities */}
        <RoomAmenities form={form} />

        {/* 4. Images */}
        <RoomImages form={form} propertyName={propertyName} />

        {/* Action Buttons */}
        <div className="flex gap-3">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1 h-11"
            >
              Hủy
            </Button>
          )}
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1 h-11 gap-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEdit ? "Cập nhật phòng" : "Thêm phòng"}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
