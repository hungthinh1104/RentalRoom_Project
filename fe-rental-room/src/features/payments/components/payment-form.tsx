"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentMethodSelector } from "./payment-method-selector";
import { paymentSchema, type PaymentInput } from "../schemas";
import { PaymentMethod } from "@/types/enums";
import { useState } from "react";

interface PaymentFormProps {
  defaultValues?: Partial<PaymentInput>;
  onSubmit: (data: PaymentInput) => void;
  isLoading?: boolean;
}

export function PaymentForm({ defaultValues, onSubmit, isLoading }: PaymentFormProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    defaultValues?.paymentMethod || PaymentMethod.CASH
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<PaymentInput>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: 0,
      paymentMethod,
      paymentDate: defaultValues?.paymentDate || new Date().toISOString().split("T")[0],
      ...defaultValues,
    },
  });

  const handlePaymentMethodChange = (method: PaymentMethod) => {
    setPaymentMethod(method);
    setValue("paymentMethod", method);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record Payment</CardTitle>
      </CardHeader>
      <CardContent>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="invoiceId">Invoice ID</Label>
            <Input
              id="invoiceId"
              disabled={isLoading}
              {...register("invoiceId")}
            />
            {errors.invoiceId && (
              <p className="text-sm text-destructive">{errors.invoiceId?.message as string}</p>
            )}
          </div>

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
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              disabled={isLoading}
              {...register("amount", { valueAsNumber: true })}
            />
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount?.message as string}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentDate">Payment Date</Label>
            <Input
              id="paymentDate"
              type="date"
              disabled={isLoading}
              {...register("paymentDate")}
            />
            {errors.paymentDate && (
              <p className="text-sm text-destructive">{errors.paymentDate?.message as string}</p>
            )}
          </div>
        </div>

        <PaymentMethodSelector
          value={paymentMethod}
          onChange={handlePaymentMethodChange}
          disabled={isLoading}
        />
        {errors.paymentMethod && (
          <p className="text-sm text-destructive">{errors.paymentMethod?.message as string}</p>
        )}

        <div className="space-y-2">
          <Label htmlFor="transactionId">Transaction ID (Optional)</Label>
          <Input
            id="transactionId"
            placeholder="TXN123456"
            disabled={isLoading}
            {...register("transactionId")}
          />
          {errors.transactionId && (
            <p className="text-sm text-destructive">{errors.transactionId?.message as string}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes (Optional)</Label>
          <textarea
            id="notes"
            rows={3}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoading}
            {...register("notes")}
          />
          {errors.notes && (
            <p className="text-sm text-destructive">{errors.notes?.message as string}</p>
          )}
        </div>

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Processing Payment..." : "Submit Payment"}
        </Button>
      </form>
      </CardContent>
    </Card>
  );
}
