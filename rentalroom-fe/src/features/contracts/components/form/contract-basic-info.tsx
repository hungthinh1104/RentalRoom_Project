"use client";

import { UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import type { ContractInput } from "../../schemas";

interface ContractBasicInfoProps {
    form: UseFormReturn<ContractInput>;
}

export function ContractBasicInfo({ form }: ContractBasicInfoProps) {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                {/* Start Date */}
                <div>
                    <Label htmlFor="startDate">Ngày bắt đầu</Label>
                    <Input
                        id="startDate"
                        type="date"
                        {...form.register("startDate")}
                    />
                    {form.formState.errors.startDate && (
                        <p className="text-sm text-destructive mt-1">
                            {form.formState.errors.startDate.message}
                        </p>
                    )}
                </div>

                {/* End Date */}
                <div>
                    <Label htmlFor="endDate">Ngày kết thúc</Label>
                    <Input
                        id="endDate"
                        type="date"
                        {...form.register("endDate")}
                    />
                    {form.formState.errors.endDate && (
                        <p className="text-sm text-destructive mt-1">
                            {form.formState.errors.endDate.message}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
