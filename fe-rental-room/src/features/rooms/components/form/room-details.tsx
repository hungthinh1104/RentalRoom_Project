"use client";

import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { RoomInput } from "../../schemas";
import { RoomStatus } from "@/types/enums";

interface RoomDetailsProps {
    form: UseFormReturn<RoomInput>;
    isLoading: boolean;
    defaultStatus?: RoomStatus;
}

const ROOM_STATUS_LABELS: Record<RoomStatus, string> = {
    [RoomStatus.AVAILABLE]: "Trống",
    [RoomStatus.OCCUPIED]: "Đã thuê",
    [RoomStatus.MAINTENANCE]: "Bảo trì",
    [RoomStatus.RESERVED]: "Dự trữ",
};

export function RoomDetails({ form, isLoading, defaultStatus }: RoomDetailsProps) {
    const { register, setValue, formState: { errors } } = form;

    return (
        <Card className="border-border/50">
            <CardHeader className="pb-4">
                <CardTitle className="text-lg">Thông tin chi tiết</CardTitle>
                <CardDescription>Kích thước và sức chứa phòng</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Area and Max Occupants Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Area */}
                    <div className="space-y-3">
                        <Label htmlFor="area" className="font-semibold">
                            Diện tích (m²)
                            <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="area"
                            type="number"
                            placeholder="20"
                            disabled={isLoading}
                            step="0.1"
                            className={cn(
                                "h-11 transition-colors",
                                errors.area && "border-destructive"
                            )}
                            {...register("area", { valueAsNumber: true })}
                        />
                        {errors.area && (
                            <p className="text-sm text-destructive flex items-center gap-1">
                                <span>!</span>
                                {errors.area.message}
                            </p>
                        )}
                    </div>

                    {/* Max Occupants */}
                    <div className="space-y-3">
                        <Label htmlFor="maxOccupants" className="font-semibold">
                            Sức chứa tối đa (người)
                        </Label>
                        <Input
                            id="maxOccupants"
                            type="number"
                            placeholder="2"
                            disabled={isLoading}
                            className="h-11 transition-colors"
                            {...register("maxOccupants", {
                                setValueAs: (v) => v === "" ? undefined : Number(v)
                            })}
                        />
                        {errors.maxOccupants && (
                            <p className="text-sm text-destructive flex items-center gap-1">
                                <span>!</span>
                                {errors.maxOccupants.message}
                            </p>
                        )}
                    </div>
                </div>

                {/* Status */}
                <div className="space-y-3">
                    <Label htmlFor="status" className="font-semibold">
                        Trạng thái
                        <span className="text-destructive">*</span>
                    </Label>
                    <Select
                        defaultValue={defaultStatus || RoomStatus.AVAILABLE}
                        onValueChange={(value) =>
                            setValue("status", value as RoomStatus)
                        }
                    >
                        <SelectTrigger
                            id="status"
                            className={cn(
                                "h-11",
                                errors.status && "border-destructive"
                            )}
                        >
                            <SelectValue placeholder="Chọn trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.entries(ROOM_STATUS_LABELS).map(([status, label]) => (
                                <SelectItem key={status} value={status}>
                                    {label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.status && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                            <span>!</span>
                            {errors.status.message}
                        </p>
                    )}
                </div>

                {/* Description */}
                <div className="space-y-3">
                    <Label htmlFor="description" className="font-semibold">
                        Mô tả (tùy chọn)
                    </Label>
                    <Textarea
                        id="description"
                        placeholder="Mô tả chi tiết về phòng: nội thất, tiện nghi, lưu ý..."
                        disabled={isLoading}
                        rows={4}
                        className="resize-none"
                        {...register("description")}
                    />
                </div>
            </CardContent>
        </Card>
    );
}
