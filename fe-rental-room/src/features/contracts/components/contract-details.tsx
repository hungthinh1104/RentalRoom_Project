"use client";

import { Contract } from "@/types";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
    CalendarDays,
    CreditCard,
    FileText,
    Home,
    User,
    Users,
    AlertTriangle,
    Download,
    Ban,
    Copy,
    CheckCircle2,
    MapPin,
    Maximize,
    DollarSign,
    Calendar,
    Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ContractStatus } from "@/types/enums";
import { useState } from "react";
import { TerminateDialog } from "./terminate-dialog";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface ContractDetailsProps {
    contract: Contract;
    onTerminate: (reason: string, noticeDays: number) => Promise<void>;
    isTerminating?: boolean;
}

export function ContractDetails({
    contract,
    onTerminate,
    isTerminating,
}: ContractDetailsProps) {
    const [showTerminateDialog, setShowTerminateDialog] = useState(false);

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(amount);
    };

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

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.4 }
        }
    };

    return (
        <motion.div
            className="space-y-8"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            {/* Header Section */}
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between bg-card p-6 rounded-xl border shadow-sm">
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
                                <span>
                                    {format(new Date(contract.startDate), "dd/MM/yyyy", { locale: vi })} - {format(new Date(contract.endDate), "dd/MM/yyyy", { locale: vi })}
                                </span>
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
                        <Button variant="outline" className="flex-1 sm:flex-none gap-2">
                            <Download className="w-4 h-4" />
                            Tải PDF
                        </Button>

                        {contract.status === ContractStatus.ACTIVE && (
                            <Button
                                variant="destructive"
                                className="flex-1 sm:flex-none gap-2"
                                onClick={() => setShowTerminateDialog(true)}
                            >
                                <Ban className="w-4 h-4" />
                                Chấm dứt
                            </Button>
                        )}
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content Column */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Room Highlights */}
                    <motion.div variants={itemVariants}>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Home className="w-5 h-5 text-primary" />
                                    Thông tin phòng
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors">
                                        <div className="p-2 bg-primary/10 text-primary rounded-md">
                                            <MapPin className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Địa chỉ & Phòng</p>
                                            <p className="font-semibold text-base mt-0.5">{contract.room?.roomNumber}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5 max-w-[200px] truncate">
                                                {contract.room?.property?.address || "N/A"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors">
                                        <div className="p-2 bg-accent text-accent-foreground rounded-md">
                                            <Maximize className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Diện tích & Loại</p>
                                            <p className="font-semibold text-base mt-0.5">{contract.room?.area || 0} m²</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">Phòng tiêu chuẩn</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Financial Overview */}
                    <motion.div variants={itemVariants}>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CreditCard className="w-5 h-5 text-primary" />
                                    Tài chính & Thanh toán
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                    <div className="flex flex-col">
                                        <span className="text-sm text-muted-foreground mb-1">Giá thuê hàng tháng</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-bold text-primary">{formatMoney(contract.monthlyRent)}</span>
                                            <span className="text-xs text-muted-foreground">/tháng</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col relative">
                                        <span className="text-sm text-muted-foreground mb-1">Tiền cọc giữ chỗ</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl font-bold text-primary">{formatMoney(contract.deposit)}</span>
                                            <Shield className="w-4 h-4 text-primary" />
                                        </div>
                                    </div>

                                    <div className="flex flex-col">
                                        <span className="text-sm text-muted-foreground mb-1">Lịch thanh toán</span>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Calendar className="w-4 h-4 text-primary" />
                                            <span className="font-medium">Ngày {contract.paymentDay || 5} hàng tháng</span>
                                        </div>
                                    </div>
                                </div>
                                <Separator className="my-6" />
                                <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
                                    <div className="flex items-start gap-3">
                                        <DollarSign className="w-5 h-5 text-primary mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-primary">Thông tin thanh toán</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Tiền phòng sẽ được tính từ ngày {format(new Date(contract.startDate), "dd/MM/yyyy")}.
                                                Hóa đơn đầu tiên đã bao gồm tiền cọc và tiền thuê tháng đầu.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Terms */}
                    <motion.div variants={itemVariants}>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-primary" />
                                    Điều khoản hợp đồng
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="prose prose-sm max-w-none text-muted-foreground bg-muted/30 p-4 rounded-lg border">
                                    {contract.terms ? contract.terms : "Không có điều khoản bổ sung đặc biệt."}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Residents Section */}
                    {contract.residents && contract.residents.length > 0 && (
                        <motion.div variants={itemVariants}>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Users className="w-5 h-5 text-primary" />
                                        Danh sách cư dân ({contract.residents.length + 1} người)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {/* Primary Tenant */}
                                        <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                                            <div className="p-2 bg-primary/10 rounded-full">
                                                <User className="w-4 h-4 text-primary" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold">{contract.tenant?.user?.fullName}</p>
                                                <p className="text-xs text-muted-foreground">Người thuê chính</p>
                                            </div>
                                        </div>

                                        {/* Additional Residents */}
                                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                        {contract.residents.map((resident: any, index: number) => (
                                            <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border">
                                                <div className="p-2 bg-muted rounded-full">
                                                    <User className="w-4 h-4" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium">{resident.fullName}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs text-muted-foreground">
                                                            {resident.relationship === 'SPOUSE' && 'Vợ/chồng'}
                                                            {resident.relationship === 'CHILD' && 'Con'}
                                                            {resident.relationship === 'PARENT' && 'Cha/mẹ'}
                                                            {resident.relationship === 'FRIEND' && 'Bạn'}
                                                            {resident.relationship === 'OTHER' && 'Khác'}
                                                        </span>
                                                        {resident.citizenId && (
                                                            <>
                                                                <span className="text-xs text-muted-foreground">•</span>
                                                                <span className="text-xs text-muted-foreground">CCCD: {resident.citizenId}</span>
                                                            </>
                                                        )}
                                                        {resident.phoneNumber && (
                                                            <>
                                                                <span className="text-xs text-muted-foreground">•</span>
                                                                <span className="text-xs text-muted-foreground">{resident.phoneNumber}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {contract.maxOccupants && (
                                        <div className="mt-4 p-3 bg-muted/30 rounded-lg border">
                                            <p className="text-sm text-muted-foreground">
                                                Giới hạn cư dân: <span className="font-semibold text-foreground">{contract.residents.length + 1}/{contract.maxOccupants} người</span>
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </div>

                {/* Sidebar Column */}
                <div className="space-y-6">

                    {/* Status Alert if needed */}
                    {contract.status === ContractStatus.EXPIRED && (
                        <motion.div variants={itemVariants}>
                            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="font-medium text-sm text-destructive">Hợp đồng hết hạn</h4>
                                        <p className="text-xs text-destructive/80 mt-1">
                                            Đã kết thúc vào {format(new Date(contract.endDate), "dd/MM/yyyy")}.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Tenant Profile */}
                    <motion.div variants={itemVariants}>
                        <Card>
                            <CardHeader className="pb-4">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <User className="w-4 h-4 text-primary" />
                                    Người thuê (Bên B)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col items-center text-center p-2">
                                    <Avatar className="w-20 h-20 mb-3 border-2 border-muted">
                                        <AvatarImage src={`https://ui-avatars.com/api/?name=${contract.tenant?.user?.fullName}&background=random`} />
                                        <AvatarFallback>{contract.tenant?.user?.fullName?.substring(0, 2).toUpperCase() || "CN"}</AvatarFallback>
                                    </Avatar>
                                    <h3 className="font-bold text-lg">{contract.tenant?.user?.fullName || "Chưa cập nhật"}</h3>
                                    <p className="text-sm text-muted-foreground mb-4">{contract.tenant?.user?.email}</p>

                                    <div className="w-full space-y-3 text-sm">
                                        <div className="flex justify-between py-2 border-b">
                                            <span className="text-muted-foreground">Điện thoại</span>
                                            <span className="font-medium">{contract.tenant?.user?.phoneNumber || "---"}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b">
                                            <span className="text-muted-foreground">CCCD/CMND</span>
                                            <span className="font-medium">{contract.tenant?.citizenId || "---"}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Landlord Profile */}
                    <motion.div variants={itemVariants}>
                        <Card>
                            <CardHeader className="pb-4">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Users className="w-4 h-4 text-primary" />
                                    Chủ nhà (Bên A)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-4 mb-4">
                                    <Avatar className="w-12 h-12 border">
                                        <AvatarImage src={`https://ui-avatars.com/api/?name=${contract.landlord?.user?.fullName}&background=0ea5e9&color=fff`} />
                                        <AvatarFallback>LA</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-bold">{contract.landlord?.user?.fullName || "Unknown"}</p>
                                        <p className="text-xs text-muted-foreground">Chủ sở hữu bất động sản</p>
                                    </div>
                                </div>
                                <div className="space-y-2 text-sm bg-muted/30 p-3 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                                        <span className="text-muted-foreground">Email:</span>
                                        <span className="ml-auto font-medium truncate max-w-[120px]" title={contract.landlord?.user?.email}>
                                            {contract.landlord?.user?.email}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                                        <span className="text-muted-foreground">SĐT:</span>
                                        <span className="ml-auto font-medium">{contract.landlord?.user?.phoneNumber || "---"}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                </div>
            </div>

            <TerminateDialog
                open={showTerminateDialog}
                onOpenChange={setShowTerminateDialog}
                onConfirm={({ reason, noticeDays }) => onTerminate(reason, noticeDays)}
                loading={isTerminating}
            />
        </motion.div>
    );
}
