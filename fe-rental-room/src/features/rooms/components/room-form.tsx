"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RoomStatus } from "@/types/enums";
import { roomSchema, type RoomInput } from "../schemas";

interface RoomFormProps {
  defaultValues?: Partial<RoomInput>;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

export function RoomForm({ defaultValues, onSubmit, isLoading }: RoomFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      propertyId: "",
      roomNumber: "",
      area: 0,
      pricePerMonth: 0,
      deposit: 0,
      status: RoomStatus.AVAILABLE,
      ...defaultValues,
    },
  } as any);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{defaultValues ? "Edit Room" : "Add New Room"}</CardTitle>
      </CardHeader>
      <CardContent>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="propertyId">Property ID</Label>
          <Input
            id="propertyId"
            disabled={isLoading}
            {...register("propertyId")}
          />
          {errors.propertyId && (
            <p className="text-sm text-destructive">{errors.propertyId?.message as string}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="roomNumber">Room Number</Label>
          <Input
            id="roomNumber"
            placeholder="101"
            disabled={isLoading}
            {...register("roomNumber")}
          />
          {errors.roomNumber && (
            <p className="text-sm text-destructive">{errors.roomNumber?.message as string}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="area">Area (m²)</Label>
            <Input
              id="area"
              type="number"
              step="0.01"
              disabled={isLoading}
              {...register("area", { valueAsNumber: true })}
            />
            {errors.area && (
              <p className="text-sm text-destructive">{errors.area?.message as string}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxOccupants">Max Occupants</Label>
            <Input
              id="maxOccupants"
              type="number"
              disabled={isLoading}
              {...register("maxOccupants", { valueAsNumber: true })}
            />
            {errors.maxOccupants && (
              <p className="text-sm text-destructive">{errors.maxOccupants?.message as string}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="pricePerMonth">Price Per Month ($)</Label>
            <Input
              id="pricePerMonth"
              type="number"
              step="0.01"
              disabled={isLoading}
              {...register("pricePerMonth", { valueAsNumber: true })}
            />
            {errors.pricePerMonth && (
              <p className="text-sm text-destructive">{errors.pricePerMonth?.message as string}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="deposit">Deposit ($)</Label>
            <Input
              id="deposit"
              type="number"
              step="0.01"
              disabled={isLoading}
              {...register("deposit", { valueAsNumber: true })}
            />
            {errors.deposit && (
              <p className="text-sm text-destructive">{errors.deposit?.message as string}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoading}
            {...register("status")}
          >
            {Object.values(RoomStatus).map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          {errors.status && (
            <p className="text-sm text-destructive">{errors.status?.message as string}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <textarea
            id="description"
            rows={4}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoading}
            {...register("description")}
          />
          {errors.description && (
            <p className="text-sm text-destructive">{errors.description?.message as string}</p>
          )}
        </div>

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Saving..." : "Save Room"}
        </Button>
      </form>
      </CardContent>
    </Card>
  );
}
