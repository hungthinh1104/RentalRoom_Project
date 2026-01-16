"use client";

import { UseFormReturn, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import type { ContractInput } from "../../schemas";

interface ContractResidentsProps {
    form: UseFormReturn<ContractInput>;
}

const RELATIONSHIP_LABELS = {
    SPOUSE: "Vợ/chồng",
    CHILD: "Con",
    PARENT: "Cha/mẹ",
    FRIEND: "Bạn",
    OTHER: "Khác",
};

export function ContractResidents({ form }: ContractResidentsProps) {
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "residents",
    });

    const maxOccupants = form.watch("maxOccupants") || 2;
    const currentOccupants = 1 + fields.length; // 1 tenant + residents
    const canAddMore = currentOccupants < maxOccupants;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                    <p className="text-sm text-muted-foreground">
                        Thêm thông tin người ở cùng (ngoài người thuê chính)
                    </p>
                </div>

                {/* Occupancy Counter */}
                <Badge variant={canAddMore ? "default" : "destructive"}>
                    {currentOccupants}/{maxOccupants} người
                </Badge>
            </div>

            {/* Residents List */}
            {fields.length > 0 && (
                <div className="space-y-3">
                    {fields.map((field, index) => (
                        <div
                            key={field.id}
                            className="grid grid-cols-12 gap-3 p-4 border rounded-lg bg-muted/30"
                        >
                            {/* Full Name */}
                            <div className="col-span-3">
                                <Label htmlFor={`residents.${index}.fullName`}>Họ và tên</Label>
                                <Input
                                    id={`residents.${index}.fullName`}
                                    {...form.register(`residents.${index}.fullName`)}
                                    placeholder="Nguyễn Văn A"
                                />
                                {form.formState.errors.residents?.[index]?.fullName && (
                                    <p className="text-sm text-destructive mt-1">
                                        {form.formState.errors.residents[index]?.fullName?.message}
                                    </p>
                                )}
                            </div>

                            {/* CCCD */}
                            <div className="col-span-3">
                                <Label htmlFor={`residents.${index}.citizenId`}>
                                    CCCD/CMND
                                </Label>
                                <Input
                                    id={`residents.${index}.citizenId`}
                                    {...form.register(`residents.${index}.citizenId`)}
                                    placeholder="001234567890"
                                />
                            </div>

                            {/* Relationship */}
                            <div className="col-span-2">
                                <Label htmlFor={`residents.${index}.relationship`}>
                                    Quan hệ
                                </Label>
                                <Select
                                    value={form.watch(`residents.${index}.relationship`)}
                                    onValueChange={(value) =>
                                        form.setValue(
                                            `residents.${index}.relationship`,
                                            value as "SPOUSE" | "CHILD" | "PARENT" | "FRIEND" | "OTHER"
                                        )
                                    }
                                >
                                    <SelectTrigger id={`residents.${index}.relationship`}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(RELATIONSHIP_LABELS).map(([value, label]) => (
                                            <SelectItem key={value} value={value}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Phone */}
                            <div className="col-span-3">
                                <Label htmlFor={`residents.${index}.phoneNumber`}>
                                    Số điện thoại
                                </Label>
                                <Input
                                    id={`residents.${index}.phoneNumber`}
                                    {...form.register(`residents.${index}.phoneNumber`)}
                                    placeholder="0912345678"
                                />
                            </div>

                            {/* Delete Button */}
                            <div className="col-span-1 flex items-end">
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    onClick={() => remove(index)}
                                    title="Xóa"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Button */}
            <Button
                type="button"
                variant="outline"
                onClick={() =>
                    append({
                        fullName: "",
                        citizenId: "",
                        relationship: "OTHER",
                        phoneNumber: "",
                    })
                }
                disabled={!canAddMore}
                className="w-full"
            >
                <Plus className="w-4 h-4 mr-2" />
                Thêm người ở cùng
                {!canAddMore && " (Đã đạt giới hạn)"}
            </Button>

            {/* Validation Error */}
            {form.formState.errors.residents?.root && (
                <p className="text-sm text-destructive">
                    {form.formState.errors.residents.root.message}
                </p>
            )}
        </div>
    );
}
