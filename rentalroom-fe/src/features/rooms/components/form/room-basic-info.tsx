"use client";

import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { RoomInput } from "../../schemas";

interface RoomBasicInfoProps {
    form: UseFormReturn<RoomInput>;
    isLoading: boolean;
}

export function RoomBasicInfo({ form, isLoading }: RoomBasicInfoProps) {
    const { register, formState: { errors }, watch } = form;
    const pricePerMonth = watch("pricePerMonth");

    return (
        <Card className="border-border/50">
            <CardHeader className="pb-4">
                <CardTitle className="text-lg">Thông tin cơ bản</CardTitle>
                <CardDescription>Thông tin phòng và giá cả</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Room Number */}
                <div className="space-y-3">
                    <Label htmlFor="roomNumber" className="font-semibold">
                        Số phòng
                        <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="roomNumber"
                        placeholder="ví dụ: 101, A1, Phòng 5"
                        disabled={isLoading}
                        className={cn(
                            "h-11 transition-colors",
                            errors.roomNumber && "border-destructive"
                        )}
                        {...register("roomNumber")}
                    />
                    {errors.roomNumber && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                            <span>!</span>
                            {errors.roomNumber.message}
                        </p>
                    )}
                </div>

                {/* Price Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Price Per Month */}
                    <div className="space-y-3">
                        <Label htmlFor="pricePerMonth" className="font-semibold">
                            Giá/tháng (VND)
                            <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="pricePerMonth"
                            type="number"
                            placeholder="1000000"
                            disabled={isLoading}
                            className={cn(
                                "h-11 transition-colors",
                                errors.pricePerMonth && "border-destructive"
                            )}
                            {...register("pricePerMonth", { valueAsNumber: true })}
                        />
                        {typeof pricePerMonth === "number" && pricePerMonth > 0 && (
                            <p className="text-xs text-success">
                                {new Intl.NumberFormat("vi-VN", {
                                    style: "currency",
                                    currency: "VND",
                                    minimumFractionDigits: 0,
                                }).format(pricePerMonth)}
                            </p>
                        )}
                        {errors.pricePerMonth && (
                            <p className="text-sm text-destructive flex items-center gap-1">
                                <span>!</span>
                                {errors.pricePerMonth.message}
                            </p>
                        )}
                    </div>

                    {/* Deposit */}
                    <div className="space-y-3">
                        <Label htmlFor="deposit" className="font-semibold">
                            Tiền cọc (VND)
                            <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="deposit"
                            type="number"
                            placeholder="2000000"
                            disabled={isLoading}
                            className={cn(
                                "h-11 transition-colors",
                                errors.deposit && "border-destructive"
                            )}
                            {...register("deposit", { valueAsNumber: true })}
                        />
                        {errors.deposit && (
                            <p className="text-sm text-destructive flex items-center gap-1">
                                <span>!</span>
                                {errors.deposit.message}
                            </p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
