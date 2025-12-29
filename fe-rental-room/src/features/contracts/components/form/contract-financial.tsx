"use client";

import { UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import type { ContractInput } from "../../schemas";

interface ContractFinancialProps {
    form: UseFormReturn<ContractInput>;
}

export function ContractFinancial({ form }: ContractFinancialProps) {
    const monthlyRent = form.watch("monthlyRent");
    const deposit = form.watch("deposit");

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
                {/* Monthly Rent */}
                <div>
                    <Label htmlFor="monthlyRent">Giá thuê/tháng (VNĐ)</Label>
                    <Input
                        id="monthlyRent"
                        type="number"
                        {...form.register("monthlyRent", { valueAsNumber: true })}
                        placeholder="5000000"
                    />
                    {monthlyRent > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                            {new Intl.NumberFormat("vi-VN", {
                                style: "currency",
                                currency: "VND",
                            }).format(monthlyRent)}
                        </p>
                    )}
                    {form.formState.errors.monthlyRent && (
                        <p className="text-sm text-destructive mt-1">
                            {form.formState.errors.monthlyRent.message}
                        </p>
                    )}
                </div>

                {/* Deposit */}
                <div>
                    <Label htmlFor="deposit">Tiền cọc (VNĐ)</Label>
                    <Input
                        id="deposit"
                        type="number"
                        {...form.register("deposit", { valueAsNumber: true })}
                        placeholder="10000000"
                    />
                    {deposit > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                            {new Intl.NumberFormat("vi-VN", {
                                style: "currency",
                                currency: "VND",
                            }).format(deposit)}
                        </p>
                    )}
                    {form.formState.errors.deposit && (
                        <p className="text-sm text-destructive mt-1">
                            {form.formState.errors.deposit.message}
                        </p>
                    )}
                </div>

                {/* Payment Day */}
                <div>
                    <Label htmlFor="paymentDay">Ngày thanh toán</Label>
                    <Input
                        id="paymentDay"
                        type="number"
                        min="1"
                        max="31"
                        {...form.register("paymentDay", { valueAsNumber: true })}
                        placeholder="5"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                        Ngày trong tháng (1-31)
                    </p>
                </div>
            </div>
        </div>
    );
}
