"use client";

import { Contract } from "@/types";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useState } from "react";
import {
    CalendarDays,
    FileText,
    Copy,
    Pencil,
    Send,
    Ban,
    Check,
    RefreshCw,
    Download,
    CheckCircle2,
    Calendar,
    AlertTriangle,
    Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContractPrintDialog } from "@/features/contracts/components/contract-print-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ContractStatus, UserRole } from "@/types/enums";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface ContractHeaderProps {
    contract: Contract;
    userRole?: UserRole;
    onEdit: () => void;
    onSend: () => void;
    onRevoke: () => void; // Used for both Revoke (Landlord) and Reject (Tenant)
    onRequestChanges: () => void;
    onApprove: () => void;
    onCheckPayment: () => void;
    onTerminate: () => void;
    isActionLoading: boolean;
}

export function ContractHeader({
    contract,
    userRole,
    onEdit,
    onSend,
    onRevoke,
    onRequestChanges,
    onApprove,
    onCheckPayment,
    onTerminate,
    isActionLoading
}: ContractHeaderProps) {
    const isLandlord = userRole === UserRole.LANDLORD || userRole === UserRole.ADMIN;

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`Đã sao chép ${label}`);
    };

    const getStatusConfig = (status: ContractStatus) => {
        switch (status) {
            case ContractStatus.ACTIVE:
                return {
                    label: "Đang hoạt động",
                    bg: "bg-green-50 dark:bg-green-950",
                    text: "text-green-700 dark:text-green-400",
                    border: "border-green-200 dark:border-green-800",
                    icon: CheckCircle2
                };
            case ContractStatus.EXPIRED:
                return {
                    label: "Đã hết hạn",
                    bg: "bg-muted",
                    text: "text-muted-foreground",
                    border: "border-muted",
                    icon: Calendar
                };
            case ContractStatus.TERMINATED:
                return {
                    label: "Đã chấm dứt",
                    bg: "bg-destructive/10",
                    text: "text-destructive",
                    border: "border-destructive/20",
                    icon: Ban
                };
            case ContractStatus.CANCELLED:
                return {
                    label: "Đã hủy",
                    bg: "bg-gray-100",
                    text: "text-gray-600",
                    border: "border-gray-200",
                    icon: Ban
                };
            case ContractStatus.DRAFT:
                return {
                    label: "Bản nháp",
                    bg: "bg-yellow-50",
                    text: "text-yellow-700",
                    border: "border-yellow-200",
                    icon: FileText
                };
            case ContractStatus.PENDING_SIGNATURE:
                return {
                    label: "Chờ ký",
                    bg: "bg-blue-50",
                    text: "text-blue-700",
                    border: "border-blue-200",
                    icon: FileText
                };
            case ContractStatus.DEPOSIT_PENDING:
                return {
                    label: "Chờ cọc",
                    bg: "bg-purple-50",
                    text: "text-purple-700",
                    border: "border-purple-200",
                    icon: FileText
                };
            default:
                return {
                    label: status,
                    bg: "bg-muted",
                    text: "text-muted-foreground",
                    border: "border",
                    icon: FileText
                };
        }
    };

    const statusConfig = getStatusConfig(contract.status);
    const StatusIcon = statusConfig.icon;

    return (
        <>
            <div className="space-y-6">
                {/* Negotiation Note Alert */}
                {contract.lastNegotiationNote && contract.status === ContractStatus.DRAFT && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex gap-3 text-yellow-800"
                    >
                        <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-semibold mb-1">Yêu cầu chỉnh sửa từ khách thuê:</h4>
                            <p className="">{contract.lastNegotiationNote}</p>
                        </div>
                    </motion.div>
                )}

                {/* --- Contract Details UI (kept from previous implementation) --- */}
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between bg-card p-6 rounded-xl border shadow-sm">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <FileText className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                                    Hợp đồng #{contract.contractNumber}
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground" onClick={() => copyToClipboard(contract.contractNumber, "Mã hợp đồng")}>
                                                    <Copy className="w-3.5 h-3.5" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Sao chép mã HĐ</TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </h1>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                    <CalendarDays className="w-4 h-4" />
                                    <span>{format(new Date(contract.startDate), "dd/MM/yyyy", { locale: vi })} - {format(new Date(contract.endDate), "dd/MM/yyyy", { locale: vi })}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                        <div className={`px-4 py-2 rounded-full border flex items-center gap-2 font-medium ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                            <StatusIcon className="w-4 h-4" />
                            {statusConfig.label}
                        </div>

                        <div className="flex gap-2 w-full sm:w-auto">
                            {contract.status === ContractStatus.ACTIVE && (
                                <Button
                                    variant="destructive"
                                    onClick={onTerminate}
                                    disabled={isActionLoading}
                                    className="flex-1 sm:flex-none gap-2 bg-red-50 hover:bg-red-100 text-red-600 border-red-200 shadow-sm border"
                                >
                                    <Ban className="w-4 h-4" />
                                    <span className="hidden sm:inline">Chấm dứt</span>
                                </Button>
                            )}

                            <ContractPrintDialog
                                contractId={contract.id}
                                contractNumber={contract.contractNumber}
                                trigger={
                                    <Button variant="outline" className="flex-1 sm:flex-none gap-2 bg-white hover:bg-gray-50 text-blue-600 border-blue-200 shadow-sm">
                                        <Download className="w-4 h-4" />
                                        <span className="hidden sm:inline">In / Xuất PDF</span>
                                    </Button>
                                }
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
