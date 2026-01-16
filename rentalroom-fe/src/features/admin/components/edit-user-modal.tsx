"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
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
import { Switch } from "@/components/ui/switch";
import { useUpdateUser } from "../hooks/use-admin-users";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const editUserSchema = z.object({
    fullName: z.string().min(2, "Tên tối thiểu 2 ký tự"),
    role: z.enum(["TENANT", "LANDLORD", "ADMIN"]),
    phoneNumber: z.string().optional(),
    emailVerified: z.boolean(),
});

type EditUserForm = z.infer<typeof editUserSchema>;

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
}

interface EditUserModalProps {
    user: User | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditUserModal({ user, open, onOpenChange }: EditUserModalProps) {
    const updateUser = useUpdateUser();

    const form = useForm<EditUserForm>({
        resolver: zodResolver(editUserSchema),
        defaultValues: {
            fullName: "",
            role: "TENANT",
            phoneNumber: "",
            emailVerified: true,
        },
    });

    useEffect(() => {
        if (user) {
            form.reset({
                fullName: user.name,
                role: user.role as "TENANT" | "LANDLORD" | "ADMIN",
                phoneNumber: "",
                emailVerified: user.status === "Hoạt động",
            });
        }
    }, [user, form]);

    const onSubmit = async (data: EditUserForm) => {
        if (!user) return;

        try {
            await updateUser.mutateAsync({
                id: user.id,
                dto: data,
            });
            toast.success("Đã cập nhật thông tin người dùng");
            onOpenChange(false);
        } catch (error: unknown) {
            const message = error && typeof error === 'object' && 'response' in error ? 
                (error as { response?: { data?: { message?: string } } }).response?.data?.message : undefined;
            toast.error(message || "Không thể cập nhật người dùng");
        }
    };

    if (!user) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Chỉnh sửa người dùng</DialogTitle>
                    <DialogDescription>
                        Cập nhật thông tin cho {user.email}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="fullName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Họ và tên</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Nguyễn Văn A" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

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
                            name="role"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Vai trò</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn vai trò" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="TENANT">Người thuê</SelectItem>
                                            <SelectItem value="LANDLORD">Chủ nhà</SelectItem>
                                            <SelectItem value="ADMIN">Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="emailVerified"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                    <div className="space-y-0.5">
                                        <FormLabel>Trạng thái tài khoản</FormLabel>
                                        <p className="text-sm text-muted-foreground">
                                            {field.value ? "Tài khoản đang hoạt động" : "Tài khoản bị vô hiệu"}
                                        </p>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Hủy
                            </Button>
                            <Button type="submit" disabled={updateUser.isPending}>
                                {updateUser.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Lưu thay đổi
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
