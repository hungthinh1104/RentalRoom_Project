"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const residentSchema = z.object({
    fullName: z.string().min(1, "Vui lòng nhập họ tên"),
    phoneNumber: z.string().optional(),
    citizenId: z.string().optional(),
    relationship: z.string().optional(),
});

type ResidentFormValues = z.infer<typeof residentSchema>;

interface ResidentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: ResidentFormValues) => void;
    initialData?: ResidentFormValues | null;
    loading?: boolean;
    mode: "create" | "update";
}

export function ResidentModal({
    open,
    onOpenChange,
    onSubmit,
    initialData,
    loading,
    mode,
}: ResidentModalProps) {
    const form = useForm<ResidentFormValues>({
        resolver: zodResolver(residentSchema),
        defaultValues: {
            fullName: "",
            phoneNumber: "",
            citizenId: "",
            relationship: "OTHER",
        },
    });

    useEffect(() => {
        if (open) {
            form.reset({
                fullName: initialData?.fullName || "",
                phoneNumber: initialData?.phoneNumber || "",
                citizenId: initialData?.citizenId || "",
                relationship: initialData?.relationship || "OTHER",
            });
        }
    }, [open, initialData, form]);

    const handleSubmit = (data: ResidentFormValues) => {
        onSubmit(data);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {mode === "create" ? "Thêm người ở" : "Cập nhật thông tin"}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="fullName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Họ và tên <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Input placeholder="Nguyễn Văn A" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="phoneNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Số điện thoại</FormLabel>
                                        <FormControl>
                                            <Input placeholder="0901234567" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="citizenId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>CCCD/CMND</FormLabel>
                                        <FormControl>
                                            <Input placeholder="12 chữ số" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="relationship"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Quan hệ với chủ hợp đồng</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        value={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn quan hệ" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="SPOUSE">Vợ/Chồng</SelectItem>
                                            <SelectItem value="CHILD">Con cái</SelectItem>
                                            <SelectItem value="PARENT">Cha/Mẹ</SelectItem>
                                            <SelectItem value="FRIEND">Bạn bè</SelectItem>
                                            <SelectItem value="RELATIVE">Người thân khác</SelectItem>
                                            <SelectItem value="OTHER">Khác</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Hủy
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? "Đang xử lý..." : "Lưu thay đổi"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
