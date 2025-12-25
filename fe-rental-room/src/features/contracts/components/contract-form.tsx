"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { contractSchema, type ContractInput } from "../schemas";

interface ContractFormProps {
  defaultValues?: Partial<ContractInput>;
  onSubmit: (data: ContractInput) => void;
  isLoading?: boolean;
}

export function ContractForm({ defaultValues, onSubmit, isLoading }: ContractFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      tenantId: "",
      landlordId: "",
      roomId: "",
      startDate: "",
      endDate: "",
      monthlyRent: 0,
      deposit: 0,
      status: "ACTIVE",
      ...defaultValues,
    },
  } as any);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{defaultValues ? "Edit Contract" : "Create New Contract"}</CardTitle>
      </CardHeader>
      <CardContent>
      <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tenantId">Tenant ID</Label>
            <Input
              id="tenantId"
              disabled={isLoading}
              {...register("tenantId")}
            />
            {errors.tenantId && (
              <p className="text-sm text-destructive">{errors.tenantId?.message as string}</p>
            )}
          </div>

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
            <Label htmlFor="roomId">Room ID</Label>
            <Input
              id="roomId"
              disabled={isLoading}
              {...register("roomId")}
            />
            {errors.roomId && (
              <p className="text-sm text-destructive">{errors.roomId?.message as string}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              disabled={isLoading}
              {...register("startDate")}
            />
            {errors.startDate && (
              <p className="text-sm text-destructive">{errors.startDate?.message as string}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              disabled={isLoading}
              {...register("endDate")}
            />
            {errors.endDate && (
              <p className="text-sm text-destructive">{errors.endDate?.message as string}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="monthlyRent">Monthly Rent ($)</Label>
            <Input
              id="monthlyRent"
              type="number"
              step="0.01"
              disabled={isLoading}
              {...register("monthlyRent", { valueAsNumber: true })}
            />
            {errors.monthlyRent && (
              <p className="text-sm text-destructive">{errors.monthlyRent?.message as string}</p>
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
          <Label htmlFor="applicationId">Application ID (Optional)</Label>
          <Input
            id="applicationId"
            disabled={isLoading}
            {...register("applicationId")}
          />
          {errors.applicationId && (
            <p className="text-sm text-destructive">{errors.applicationId?.message as string}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="terms">Terms (Optional)</Label>
          <textarea
            id="terms"
            rows={4}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoading}
            {...register("terms")}
          />
          {errors.terms && (
            <p className="text-sm text-destructive">{errors.terms?.message as string}</p>
          )}
        </div>

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Creating Contract..." : "Create Contract"}
        </Button>
      </form>
      </CardContent>
    </Card>
  );
}
