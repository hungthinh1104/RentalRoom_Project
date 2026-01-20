"use client";

import { useState } from "react";
import { Contract } from "@/types";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Pencil, Trash, User, Users } from "lucide-react";
import { ResidentModal } from "../resident-modal";
import { useAddResident, useUpdateResident, useRemoveResident } from "../../hooks/use-contracts";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface ContractResidentsProps {
    contract: Contract;
    isOwner: boolean; // Landlord or Tenant of this contract
}

export function ContractResidents({ contract, isOwner }: ContractResidentsProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingResident, setEditingResident] = useState<any>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const addMutation = useAddResident();
    const updateMutation = useUpdateResident();
    const removeMutation = useRemoveResident();

    const handleCreate = () => {
        setEditingResident(null);
        setIsModalOpen(true);
    };

    const handleEdit = (resident: any) => {
        setEditingResident(resident);
        setIsModalOpen(true);
    };

    const handleDelete = async () => {
        if (!deletingId) return;
        try {
            await removeMutation.mutateAsync({ contractId: contract.id, residentId: deletingId });
            toast.success("Đã xóa người ở thành công");
        } catch (error) {
            toast.error("Xóa thất bại");
        } finally {
            setDeletingId(null);
        }
    };

    const handleSubmit = async (data: any) => {
        try {
            if (editingResident) {
                await updateMutation.mutateAsync({
                    contractId: contract.id,
                    residentId: editingResident.id,
                    data,
                });
                toast.success("Cập nhật thông tin thành công");
            } else {
                await addMutation.mutateAsync({
                    contractId: contract.id,
                    data,
                });
                toast.success("Thêm người ở thành công");
            }
            setIsModalOpen(false);
        } catch (error: any) {
            // Extract error message from backend if available
            const msg = error?.response?.data?.message || error.message || "Có lỗi xảy ra";
            toast.error(msg);
        }
    };

    const getRelationshipLabel = (rel: string) => {
        const map: Record<string, string> = {
            SPOUSE: "Vợ/Chồng",
            CHILD: "Con cái",
            PARENT: "Cha/Mẹ",
            FRIEND: "Bạn bè",
            RELATIVE: "Người thân",
            OTHER: "Khác"
        };
        return map[rel] || rel;
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        Danh sách người ở ({contract.residents?.length || 0})
                    </CardTitle>
                    <CardDescription>
                        Quản lý thông tin những người đang cư trú tại phòng này
                    </CardDescription>
                </div>
                {isOwner && (
                    <Button onClick={handleCreate} size="sm" className="gap-2">
                        <Plus className="w-4 h-4" />
                        Thêm người
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Họ và tên</TableHead>
                                <TableHead>Quan hệ</TableHead>
                                <TableHead>Liên hệ</TableHead>
                                <TableHead>Giấy tờ tùy thân</TableHead>
                                {isOwner && <TableHead className="w-[50px]"></TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {contract.residents && contract.residents.length > 0 ? (
                                contract.residents.map((resident: any) => (
                                    <TableRow key={resident.id}>
                                        <TableCell className="font-medium flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                <User className="w-4 h-4" />
                                            </div>
                                            {resident.fullName}
                                        </TableCell>
                                        <TableCell>{getRelationshipLabel(resident.relationship)}</TableCell>
                                        <TableCell>{resident.phoneNumber || "-"}</TableCell>
                                        <TableCell>{resident.citizenId || "-"}</TableCell>
                                        {isOwner && (
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleEdit(resident)}>
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            Chỉnh sửa
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-red-600"
                                                            onClick={() => setDeletingId(resident.id)}
                                                        >
                                                            <Trash className="mr-2 h-4 w-4" />
                                                            Xóa
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        Chưa có thông tin người ở.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>

            <ResidentModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                onSubmit={handleSubmit}
                initialData={editingResident}
                mode={editingResident ? "update" : "create"}
                loading={addMutation.isPending || updateMutation.isPending}
            />

            <AlertDialog open={!!deletingId} onOpenChange={(open: boolean) => !open && setDeletingId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xóa người ở?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc chắn muốn xóa người này khỏi danh sách cư trú?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={removeMutation.isPending}
                        >
                            {removeMutation.isPending ? "Đang xóa..." : "Xóa"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}
