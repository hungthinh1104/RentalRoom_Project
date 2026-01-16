"use client";

import { useState } from "react";
import { useForm, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useRooms } from "../hooks/use-rooms";
import { RoomStatus, AmenityType } from "../types";
import { Loader2, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/common/ImageUpload";

const roomSchema = z.object({
    roomNumberStart: z.string().min(1, "Bắt buộc"),
    roomNumberEnd: z.string().optional(), // If provided, generates range
    area: z.coerce.number().min(1, "Diện tích > 0"),
    pricePerMonth: z.coerce.number().min(0, "Giá > 0"),
    deposit: z.coerce.number().min(0, "Cọc >= 0"),
    maxOccupants: z.coerce.number().min(1, "Người ở >= 1"),
    description: z.string().optional(),
    images: z.array(z.string()).optional(),
    // Checkbox amenities
    hasAC: z.boolean().default(false),
    hasFridge: z.boolean().default(false),
    hasWasher: z.boolean().default(false),
    hasBed: z.boolean().default(false),
    hasWifi: z.boolean().default(false),
});

type RoomFormValues = z.infer<typeof roomSchema>;

interface AddRoomDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    propertyId: string;
}

export function AddRoomDialog({ open, onOpenChange, propertyId }: AddRoomDialogProps) {
    const { bulkCreateRooms, isCreating } = useRooms();
    const [isRangeMode, setIsRangeMode] = useState(false);

    const form = useForm<RoomFormValues>({
        resolver: zodResolver(roomSchema) as Resolver<RoomFormValues>,
        defaultValues: {
            roomNumberStart: "",
            roomNumberEnd: "",
            area: 25,
            pricePerMonth: 3000000,
            deposit: 3000000,
            maxOccupants: 2,
            description: "",
            images: [],
            hasAC: false,
            hasFridge: false,
            hasWasher: false,
            hasBed: false,
            hasWifi: true,
        },
    });

    const onSubmit = async (data: RoomFormValues) => {
        try {
            // Map checkbox amenities to AmenityType array
            const amenities: AmenityType[] = [];
            if (data.hasAC) amenities.push(AmenityType.AC);
            if (data.hasFridge) amenities.push(AmenityType.FRIDGE);
            if (data.hasWasher) amenities.push(AmenityType.WASHER);
            if (data.hasBed) amenities.push(AmenityType.BED);
            if (data.hasWifi) amenities.push(AmenityType.WIFI);

            const roomsPayload = [];

            // Logic for Range Generation
            if (isRangeMode && data.roomNumberEnd) {
                const start = parseInt(data.roomNumberStart);
                const end = parseInt(data.roomNumberEnd);

                if (isNaN(start) || isNaN(end) || start > end) {
                    toast.error("Khoảng phòng không hợp lệ", { description: "Vui lòng nhập số (ví dụ: 101 đến 105)" });
                    return;
                }

                for (let i = start; i <= end; i++) {
                    roomsPayload.push({
                        propertyId,
                        roomNumber: i.toString(),
                        area: data.area,
                        pricePerMonth: data.pricePerMonth,
                        deposit: data.deposit,
                        status: RoomStatus.AVAILABLE,
                        description: data.description,
                        maxOccupants: data.maxOccupants,
                        images: data.images,
                        amenities,
                    });
                }
            } else {
                // Single Room
                roomsPayload.push({
                    propertyId,
                    roomNumber: data.roomNumberStart,
                    area: data.area,
                    pricePerMonth: data.pricePerMonth,
                    deposit: data.deposit,
                    status: RoomStatus.AVAILABLE,
                    description: data.description,
                    maxOccupants: data.maxOccupants,
                    images: data.images,
                    amenities,
                });
            }

            await bulkCreateRooms({ rooms: roomsPayload });
            toast.success(`Đã tạo ${roomsPayload.length} phòng thành công!`);
            onOpenChange(false);
            form.reset();
        } catch (error: any) {
            toast.error("Lỗi khi tạo phòng", { description: error?.response?.data?.message || "Vui lòng thử lại" });
        }
    };

    const images = form.watch("images") || [];
    const addImage = (url: string) => form.setValue("images", [...images, url]);
    const removeImage = (idx: number) => {
        const newImgs = [...images];
        newImgs.splice(idx, 1);
        form.setValue("images", newImgs);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] bg-background/95 backdrop-blur-3xl border-border/40 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Thêm Phòng Mới</DialogTitle>
                    <DialogDescription>
                        Điền thông tin phòng. Sử dụng chế độ &quot;Tạo hàng loạt&quot; để thêm nhanh nhiều phòng.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex items-center gap-2 mb-4 bg-muted/30 p-3 rounded-lg border border-border/30">
                    <Switch checked={isRangeMode} onCheckedChange={setIsRangeMode} id="range-mode" />
                    <Label htmlFor="range-mode" className="flex items-center gap-2 cursor-pointer font-medium">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        Chế độ Tạo Hàng Loạt (Range Mode)
                    </Label>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="roomNumberStart" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{isRangeMode ? "Từ số (Ví dụ: 101)" : "Số phòng / Tên phòng"}</FormLabel>
                                    <FormControl>
                                        <Input placeholder="101" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            {isRangeMode && (
                                <FormField control={form.control} name="roomNumberEnd" render={({ field }) => (
                                    <FormItem className="animate-in fade-in slide-in-from-left-4">
                                        <FormLabel>Đến số (Ví dụ: 105)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="105" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="pricePerMonth" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Giá thuê (VNĐ)</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="deposit" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tiền cọc (VNĐ)</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="area" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Diện tích (m²)</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="maxOccupants" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Số người tối đa</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        {/* Amenities Checkboxes */}
                        <div className="space-y-2">
                            <Label>Tiện nghi có sẵn</Label>
                            <div className="flex flex-wrap gap-4">
                                <FormField control={form.control} name="hasWifi" render={({ field }) => (
                                    <div className="flex items-center space-x-2">
                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                        <Label>Wifi</Label>
                                    </div>
                                )} />
                                <FormField control={form.control} name="hasAC" render={({ field }) => (
                                    <div className="flex items-center space-x-2">
                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                        <Label>Máy lạnh</Label>
                                    </div>
                                )} />
                                <FormField control={form.control} name="hasFridge" render={({ field }) => (
                                    <div className="flex items-center space-x-2">
                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                        <Label>Tủ lạnh</Label>
                                    </div>
                                )} />
                                <FormField control={form.control} name="hasWasher" render={({ field }) => (
                                    <div className="flex items-center space-x-2">
                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                        <Label>Máy giặt</Label>
                                    </div>
                                )} />
                                <FormField control={form.control} name="hasBed" render={({ field }) => (
                                    <div className="flex items-center space-x-2">
                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                        <Label>Giường</Label>
                                    </div>
                                )} />
                            </div>
                        </div>

                        {/* Images */}
                        <div className="space-y-2">
                            <Label>Hình ảnh mẫu (Áp dụng cho tất cả phòng tạo ra)</Label>
                            <div className="grid grid-cols-4 gap-2">
                                {images.map((url, idx) => (
                                    <ImageUpload key={idx} value={url} onSuccess={() => { }} onRemove={() => removeImage(idx)} className="h-20 w-auto" />
                                ))}
                                {images.length < 3 && <ImageUpload onSuccess={addImage} folder="/rooms" className="h-20 w-auto" />}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
                            <Button type="submit" disabled={isCreating} className="bg-amber-500 hover:bg-amber-600">
                                {isCreating ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                                {isRangeMode ? "Tạo hàng loạt" : "Tạo phòng"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
