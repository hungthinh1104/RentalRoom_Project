"use client";

import { Contract } from "@/types";
import {
    CreditCard,
    DollarSign,
    Calendar,
    Shield,
    Copy,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { ContractStatus } from "@/types/enums";
import { toast } from "sonner";

interface ContractFinancialsProps {
    contract: Contract;
}

export function ContractFinancials({ contract }: ContractFinancialsProps) {
    const isFinancialVisible = [ContractStatus.DEPOSIT_PENDING, ContractStatus.ACTIVE, ContractStatus.TERMINATED, ContractStatus.EXPIRED, ContractStatus.CANCELLED].includes(contract.status as any);

    if (!isFinancialVisible) {
        return null;
    }

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

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.4 }
        }
    };

    const getBankCode = (bankName: string | undefined | null): string => {
        if (!bankName) return "";
        const name = bankName.toLowerCase().trim();
        const map: Record<string, string> = {
            "vietinbank": "ICB",
            "vietcombank": "VCB",
            "bidv": "BIDV",
            "agribank": "VBA",
            "ocb": "OCB",
            "mbbank": "MB",
            "mb": "MB",
            "techcombank": "TCB",
            "acb": "ACB",
            "vpbank": "VPB",
            "tpbank": "TPB",
            "sacombank": "STB",
            "hdbank": "HDB",
            "vib": "VIB",
            "shb": "SHB",
            "eximbank": "EIB",
            "msb": "MSB",
            "seabank": "SEAB",
            "lienvietpostbank": "LPB",
            "lpb": "LPB",
        };
        // Return mapped code or original if not found (fallback)
        return map[name] || bankName.split(' ')[0].toUpperCase();
        // Heuristic: Use first word if not mapped (e.g. "MB Bank" -> "MB")
    };

    return (
        <div className="space-y-6">
            {/* Deposit Payment Info (Only when DEPOSIT_PENDING) */}
            {contract.status === ContractStatus.DEPOSIT_PENDING && (
                <motion.div variants={itemVariants} initial="hidden" animate="visible">
                    <Card className="border-primary/50 shadow-md bg-primary/5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-primary">
                                <Shield className="w-5 h-5" />
                                Thông tin thanh toán cọc
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col md:flex-row gap-6 items-center">
                                <div className="flex-1 space-y-4 w-full">
                                    <div className="p-4 bg-background rounded-lg border space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Số tiền cọc:</span>
                                            <span className="font-bold text-xl text-primary">{formatMoney(contract.deposit)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground">Nội dung chuyển khoản:</span>
                                            <div className="flex items-center gap-2">
                                                <code className="bg-muted px-2 py-1 rounded font-mono font-bold text-lg">{contract.paymentRef || "N/A"}</code>
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(contract.paymentRef || "", "Nội dung CK")}>
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Hạn thanh toán:</span>
                                            <span className="text-destructive font-medium">
                                                {contract.depositDeadline ? format(new Date(contract.depositDeadline), "HH:mm dd/MM/yyyy") : "N/A"}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        * Vui lòng chuyển khoản chính xác số tiền và nội dung trên. Hệ thống sẽ tự động kích hoạt hợp đồng sau 1-5 phút khi nhận được tiền.
                                    </p>
                                </div>
                                <div className="flex-shrink-0">
                                    {/* SePay QR Code Generator */}
                                    {contract.landlord?.bankName && contract.landlord?.bankAccount && (
                                        <div className="bg-white p-3 rounded-xl border shadow-sm">
                                            <div className="w-40 h-40 bg-white flex items-center justify-center rounded-lg overflow-hidden">
                                                <img
                                                    src={`https://qr.sepay.vn/img?bank=${encodeURIComponent(getBankCode(contract.landlord.bankName))}&acc=${encodeURIComponent(contract.landlord.bankAccount)}&amount=${contract.deposit}&des=${encodeURIComponent(`COC ${contract.contractNumber}`)}`}
                                                    alt="Mã QR thanh toán SePay"
                                                    className="w-full h-full object-contain"
                                                    referrerPolicy="no-referrer"
                                                />
                                            </div>
                                            <p className="text-center text-[10px] text-muted-foreground mt-2">
                                                {contract.landlord.bankName} ({contract.landlord.bankAccount})
                                            </p>
                                        </div>
                                    )}
                                    {(!contract.landlord?.bankName || !contract.landlord?.bankAccount) && (
                                        <div className="bg-destructive/10 p-3 rounded-xl border border-destructive/20 w-40 h-40 flex items-center justify-center">
                                            <p className="text-center text-xs text-destructive">
                                                Chủ nhà chưa cấu hình ngân hàng
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Financial Overview */}
            <motion.div variants={itemVariants} initial="hidden" animate="visible">
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
        </div>
    );
}
