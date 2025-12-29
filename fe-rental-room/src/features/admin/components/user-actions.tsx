"use client";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash2, UserCheck, UserX } from "lucide-react";
import { useToggleUserStatus, useDeleteUser } from "../hooks/use-admin-users";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

interface UserActionsProps {
    userId: string;
    userName: string;
    isActive: boolean;
    onEdit: () => void;
}

export function UserActions({ userId, userName, isActive, onEdit }: UserActionsProps) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const toggleStatus = useToggleUserStatus();
    const deleteUser = useDeleteUser();

    const handleToggleStatus = async () => {
        try {
            await toggleStatus.mutateAsync({ id: userId, active: !isActive });
            toast.success(isActive ? "Đã vô hiệu hóa tài khoản" : "Đã kích hoạt tài khoản");
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Không thể cập nhật trạng thái");
        }
    };

    const handleDelete = async () => {
        try {
            await deleteUser.mutateAsync(userId);
            toast.success("Đã xóa người dùng");
            setDeleteDialogOpen(false);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Không thể xóa người dùng");
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Mở menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onEdit}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Chỉnh sửa
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleToggleStatus}>
                        {isActive ? (
                            <>
                                <UserX className="mr-2 h-4 w-4" />
                                Vô hiệu hóa
                            </>
                        ) : (
                            <>
                                <UserCheck className="mr-2 h-4 w-4" />
                                Kích hoạt
                            </>
                        )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={() => setDeleteDialogOpen(true)}
                        className="text-destructive focus:text-destructive"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Xóa
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa người dùng?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc chắn muốn xóa người dùng <strong>{userName}</strong>?
                            Hành động này không thể hoàn tác.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Xóa
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
