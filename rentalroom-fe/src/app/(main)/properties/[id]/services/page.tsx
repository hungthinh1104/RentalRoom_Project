"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useServices, useDeleteService } from "@/features/services/api/services-queries";
import { Service } from "@/features/services/api/services-api";
import { getServicesColumns } from "./columns";
import { DataTable } from "@/components/data-table/data-table"; // Updated import path based on previous finding
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ServiceDialog } from "./service-dialog";
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
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

export default function ServicesPage() {
    const params = useParams();
    const propertyId = params.id as string;

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingService, setEditingService] = useState<Service | undefined>(undefined);
    const [deletingService, setDeletingService] = useState<Service | null>(null);

    const { data: servicesData, isLoading } = useServices({ propertyId, limit: 100 }); // Show all services for simplicity
    const deleteServiceMutation = useDeleteService();

    const handleEdit = (service: Service) => {
        setEditingService(service);
        setDialogOpen(true);
    };

    const handleCreate = () => {
        setEditingService(undefined);
        setDialogOpen(true);
    };

    const handleDeleteClick = (service: Service) => {
        setDeletingService(service);
    };

    const handleConfirmDelete = async () => {
        if (!deletingService) return;

        try {
            await deleteServiceMutation.mutateAsync(deletingService.id);
            toast.success("Xóa dịch vụ thành công");
        } catch (error) {
            toast.error("Xóa dịch vụ thất bại");
            console.error(error);
        } finally {
            setDeletingService(null);
        }
    };

    // Define columns with the current handlers
    const columns = getServicesColumns({
        onEdit: handleEdit,
        onDelete: handleDeleteClick,
    });

    const services = servicesData?.data || [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Dịch vụ & Tiện ích</h3>
                    <p className="text-sm text-muted-foreground">
                        Quản lý các loại phí dịch vụ (Điện, Nước, ...) áp dụng cho nhà trọ này.
                    </p>
                </div>
                <Button onClick={handleCreate} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Thêm dịch vụ
                </Button>
            </div>
            <Separator />

            <div className="bg-white rounded-md border">
                <DataTable
                    columns={columns}
                    data={services}
                    loading={isLoading}
                    searchKey="serviceName"
                />
            </div>

            <ServiceDialog
                open={dialogOpen}
                onOpenChange={(open: boolean) => setDialogOpen(open)}
                service={editingService}
                propertyId={propertyId}
            />

            <AlertDialog open={!!deletingService} onOpenChange={(open: boolean) => !open && setDeletingService(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Hành động này không thể hoàn tác. Dịch vụ "{deletingService?.serviceName}" sẽ bị xóa khỏi hệ thống.
                            Các hóa đơn cũ đã tạo vẫn sẽ giữ nguyên lịch sử.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={handleConfirmDelete}
                            disabled={deleteServiceMutation.isPending}
                        >
                            {deleteServiceMutation.isPending ? "Đang xóa..." : "Xóa vĩnh viễn"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
