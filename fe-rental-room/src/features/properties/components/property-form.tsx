"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PropertyType } from "@/types/enums";
import { propertySchema, type PropertyInput } from "../schemas";

interface PropertyFormProps {
  defaultValues?: Partial<PropertyInput>;
  onSubmit: (data: PropertyInput) => void;
  isLoading?: boolean;
}

export function PropertyForm({ defaultValues, onSubmit, isLoading }: PropertyFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      name: "",
      address: "",
      city: "",
      district: "",
      ward: "",
      propertyType: PropertyType.APARTMENT,
      area: 0,
      totalRooms: 0,
      ...defaultValues,
    },
  } as any);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{defaultValues ? "Edit Property" : "Add New Property"}</CardTitle>
      </CardHeader>
      <CardContent>
      <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="landlordId">Landlord ID</Label>
          <Input
            id="landlordId"
            disabled={isLoading}
            {...register("landlordId")}
          />
          {errors.landlordId && (
            <p className="text-sm text-destructive">{errors.landlordId?.message as string}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Property Name</Label>
          <Input
            id="name"
            placeholder="Sunrise Apartments"
            disabled={isLoading}
            {...register("name")}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name?.message as string}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            placeholder="123 Main Street"
            disabled={isLoading}
            {...register("address")}
          />
          {errors.address && (
            <p className="text-sm text-destructive">{errors.address?.message as string}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              placeholder="Ho Chi Minh City"
              disabled={isLoading}
              {...register("city")}
            />
            {errors.city && (
              <p className="text-sm text-destructive">{errors.city?.message as string}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="district">District</Label>
            <Input
              id="district"
              placeholder="District 1"
              disabled={isLoading}
              {...register("district")}
            />
            {errors.district && (
              <p className="text-sm text-destructive">{errors.district?.message as string}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="propertyType">Property Type</Label>
          <select
            id="propertyType"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoading}
            {...register("propertyType")}
          >
            {Object.values(PropertyType).map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          {errors.propertyType && (
            <p className="text-sm text-destructive">{errors.propertyType?.message as string}</p>
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
          {isLoading ? "Saving..." : "Save Property"}
        </Button>
      </form>
      </CardContent>
    </Card>
  );
}
