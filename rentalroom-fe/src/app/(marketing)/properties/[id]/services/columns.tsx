"use client";

import { ColumnDef, Row } from "@tanstack/react-table";
import { Service, ServiceType, BillingMethod } from "@/features/services/api/services-api";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

// Helper for type badges
const getServiceTypeBadge = (type: ServiceType) => {
    switch (type) {
        case ServiceType.ELECTRICITY:
            return <Badge variant="default" className="bg-utility-electric text-black">Điện</Badge>;
        case ServiceType.WATER:
            return <Badge variant="default" className="bg-utility-water text-white">Nước</Badge>;
        case ServiceType.INTERNET:
            return <Badge variant="default" className="bg-utility-internet text-white">Internet</Badge>;
        case ServiceType.PARKING:
            return <Badge variant="secondary">Gửi xe</Badge>;
        case ServiceType.CLEANING:
            return <Badge variant="outline">Vệ sinh</Badge>;
        default:
            return <Badge variant="outline">{type}</Badge>;
    }
};

const getBillingMethodBadge = (method: BillingMethod) => {
    switch (method) {
        case BillingMethod.METERED:
            return <Badge variant="outline" className="border-info text-info">Theo chỉ số</Badge>;
        case BillingMethod.FIXED:
            return <Badge variant="outline" className="border-success text-success">Cố định</Badge>;
        default:
            return <Badge variant="outline">{method}</Badge>;
    }
};

interface ServicesColumnsProps {
    onEdit: (service: Service) => void;
    onDelete: (service: Service) => void;
}

export const getServicesColumns = ({ onEdit, onDelete }: ServicesColumnsProps): ColumnDef<Service>[] => [
    {
        accessorKey: "serviceName",
        header: "Tên dịch vụ",
    },
    {
        accessorKey: "serviceType",
        header: "Loại dịch vụ",
        cell: ({ row }: { row: Row<Service> }) => getServiceTypeBadge(row.original.serviceType),
    },
    {
        accessorKey: "billingMethod",
        header: "Cách tính phí",
        cell: ({ row }: { row: Row<Service> }) => getBillingMethodBadge(row.original.billingMethod),
    },
    {
        accessorKey: "unitPrice",
        header: "Đơn giá",
        cell: ({ row }: { row: Row<Service> }) => {
            const price = parseFloat(row.getValue("unitPrice") as string);
            const unit = row.original.unit ? ` / ${row.original.unit}` : "";
            return <div className="font-medium">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)}{unit}</div>;
        },
    },
    {
        accessorKey: "description",
        header: "Mô tả",
        cell: ({ row }: { row: Row<Service> }) => <div className="max-w-[200px] truncate text-muted-foreground">{(row.getValue("description") as string) || "-"}</div>,
    },
    {
        id: "actions",
        cell: ({ row }: { row: Row<Service> }) => {
            const service = row.original;

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onEdit(service)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Chỉnh sửa
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(service)} className="text-destructive focus:text-destructive">
                            <Trash className="mr-2 h-4 w-4" />
                            Xóa dịch vụ
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];
