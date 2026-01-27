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
                className: "bg-warning/10 text-warning border-warning/20",
                icon: FileText,
            };
        case ContractStatus.PENDING_SIGNATURE:
            return {
                label: "Chờ thanh toán",
                className: "bg-info/10 text-info border-info/20",
                icon: Wallet,
            };
        case ContractStatus.DEPOSIT_PENDING:
            return {
                label: "Đang xử lý thanh toán",
                className: "bg-accent-purple/10 text-accent-purple border-accent-purple/20",
                icon: Clock,
            };
        case ContractStatus.ACTIVE:
            return {
                label: "Đang hiệu lực",
                className: "bg-success/10 text-success border-success/20",
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
                className: "bg-warning/10 text-warning border-warning/20",
                icon: CalendarX,
            };
        case ContractStatus.CANCELLED:
            return {
                label: "Đã hủy",
                className: "bg-muted text-muted-foreground border-border",
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
        <Badge className={cn(config.className, className)} variant="outline">
            <Icon className="w-3 h-3 mr-1" />
            {config.label}
        </Badge>
    );
}
