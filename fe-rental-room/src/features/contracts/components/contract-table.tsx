"use client";

import Link from "next/link";
import { format } from "date-fns";
import { MoreHorizontal, Eye, Pencil, Trash } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data-table/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Contract } from "@/types";
import { ContractStatus } from "@/types/enums";

function formatDate(dateString: string): string {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "dd/MM/yyyy");
}

function getStatusVariant(status: ContractStatus): "default" | "secondary" | "destructive" | "outline" {
    switch (status) {
        case ContractStatus.ACTIVE:
            return "default";
        case ContractStatus.EXPIRED:
            return "secondary"; // or warning color if available
        case ContractStatus.TERMINATED:
        case ContractStatus.CANCELLED:
            return "destructive";
        default:
            return "outline";
    }
}

export const columns: ColumnDef<Contract>[] = [
    {
        accessorKey: "contractNumber",
        header: "Mã HĐ",
        cell: ({ row }) => <span className="font-medium">{row.getValue("contractNumber")}</span>,
    },
    {
        accessorKey: "room",
        header: "Phòng",
        cell: ({ row }) => {
            const room = row.original.room;
            return (
                <div className="flex flex-col">
                    <span className="font-medium">{room?.roomNumber}</span>
                    <span className="text-xs text-muted-foreground">{room?.property?.name}</span>
                </div>
            )
        }
    },
    {
        accessorKey: "tenant",
        header: "Khách thuê",
        cell: ({ row }) => <div>{row.original.tenant?.user?.fullName}</div>,
    },
    {
        accessorKey: "duration",
        header: "Thời hạn",
        cell: ({ row }) => {
            return (
                <div className="text-sm">
                    <div>{formatDate(row.original.startDate)}</div>
                    <div className="text-muted-foreground text-xs">đến {formatDate(row.original.endDate)}</div>
                </div>
            )
        },
    },
    {
        accessorKey: "monthlyRent",
        header: "Giá thuê",
        cell: ({ row }) => {
            return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(row.original.monthlyRent);
        }
    },
    {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row }) => {
            const status = row.original.status as ContractStatus;
            return <Badge variant={getStatusVariant(status)}>{status}</Badge>
        },
    },
    {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
            const contract = row.original;

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Hành động</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                            <Link href={`/contracts/${contract.id}`} className="flex items-center cursor-pointer">
                                <Eye className="mr-2 h-4 w-4" /> Chi tiết
                            </Link>
                        </DropdownMenuItem>
                        {/* Add Edit/Terminate if needed, currently just linking to details where likely these actions exist */}
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];

interface ContractTableProps {
    data: Contract[];
}

export function ContractTable({ data }: ContractTableProps) {
    return (
        <DataTable columns={columns} data={data} searchKey="contractNumber" />
    )
}
