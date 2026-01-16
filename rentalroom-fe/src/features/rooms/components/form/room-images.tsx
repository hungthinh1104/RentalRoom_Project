"use client";

import { UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ImageUpload } from "@/components/common/image-upload";
import { RoomInput } from "../../schemas";

interface RoomImagesProps {
    form: UseFormReturn<RoomInput>;
    propertyName?: string;
}

export function RoomImages({ form, propertyName }: RoomImagesProps) {
    const { watch, setValue, formState: { errors } } = form;
    const currentImages = watch("images") as string[] | undefined;
    const currentRoomNumber = watch("roomNumber") as string | undefined;

    const fileNamePrefix = `${propertyName || "room"}_${currentRoomNumber || "unit"}`;

    return (
        <Card className="border-border/50">
            <CardHeader className="pb-4">
                <CardTitle className="text-lg">Hình ảnh</CardTitle>
                <CardDescription>Thêm đường dẫn hình ảnh cho phòng</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-4">
                    <div className="flex flex-col gap-3">
                        <Label>Hình ảnh</Label>
                        <ImageUpload
                            value={currentImages || []}
                            onChange={(urls) => setValue("images", urls, { shouldDirty: true })}
                            maxFiles={5}
                            fileNamePrefix={fileNamePrefix}
                        />
                        <p className="text-xs text-muted-foreground">Tải lên tối đa 5 ảnh (JPG, PNG, WebP). Tự động tối ưu hóa.</p>
                    </div>
                    {errors.images && (
                        <p className="text-sm text-destructive flex items-center gap-1 mt-2">
                            <span>!</span>
                            {errors.images.message}
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
