"use client";

import { Badge } from "@/components/ui/badge";
import { ContractStatus } from "@/types";
import { FileText, Wallet, Clock, CheckCircle, XCircle, CalendarX } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContractStatusBadgeProps {
    status: ContractStatus;
    className?: string;
}

const getStatusConfig = (status: ContractStatus) => {
    switch (status) {
        case ContractStatus.DRAFT:
            return {
                label: "Chờ phê duyệt",
                className: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-800",
                icon: FileText,
            };
        case ContractStatus.PENDING_SIGNATURE:
            return {
                label: "Chờ thanh toán",
                className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800",
                icon: Wallet,
            };
        case ContractStatus.DEPOSIT_PENDING:
            return {
                label: "Đang xử lý thanh toán",
                className: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-800",
                icon: Clock,
            };
        case ContractStatus.ACTIVE:
            return {
                label: "Đang hiệu lực",
                className: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800",
                icon: CheckCircle,
            };
        case ContractStatus.TERMINATED:
            return {
                label: "Đã chấm dứt",
                className: "bg-destructive/10 text-destructive border-destructive/20",
                icon: XCircle,
            };
        case ContractStatus.EXPIRED:
            return {
                label: "Hết hạn",
                className: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-800",
                icon: CalendarX,
            };
        case ContractStatus.CANCELLED:
            return {
                label: "Đã hủy",
                className: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700",
                icon: XCircle,
            };
        default:
            return {
                label: "Không rõ",
                className: "bg-muted text-muted-foreground",
                icon: FileText,
            };
    }
};

export function ContractStatusBadge({ status, className }: ContractStatusBadgeProps) {
    const config = getStatusConfig(status);
    const Icon = config.icon;

    return (
        <Badge className={`${config.className} ${className || ""}`} variant="outline">
            <Icon className="w-3 h-3 mr-1" />
            {config.label}
        </Badge>
    );
}
