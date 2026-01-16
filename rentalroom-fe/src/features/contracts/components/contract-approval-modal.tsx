"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useApproveContract } from "../hooks/use-approve-contract";
import type { Contract } from "@/types";
import { FileText, MapPin, Calendar, DollarSign, Users } from "lucide-react";
import { format } from "date-fns";

interface ContractApprovalModalProps {
    contract: Contract | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ContractApprovalModal({ contract, open, onOpenChange }: ContractApprovalModalProps) {
    const [agreed, setAgreed] = useState(false);
    const router = useRouter();
    const approveMutation = useApproveContract();

    const handleApprove = async () => {
        if (!contract || !agreed) return;

        try {
            await approveMutation.mutateAsync(contract.id);
            onOpenChange(false);
            // Redirect to payment page
            router.push(`/dashboard/tenant/contracts/${contract.id}/payment`);
        } catch (error) {
            // Error handled by mutation
        }
    };

    if (!contract) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Phê duyệt hợp đồng
                    </DialogTitle>
                    <DialogDescription>
                        Vui lòng xem xét kỹ các điều khoản trước khi phê duyệt
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Contract Info */}
                    <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                        <h3 className="font-semibold flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Thông tin hợp đồng
                        </h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-muted-foreground">Số hợp đồng</p>
                                <p className="font-medium">{contract.contractNumber}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Phòng</p>
                                <p className="font-medium">
                                    {contract.room?.roomNumber || "—"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Property Details */}
                    <div className="space-y-2">
                        <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                            <div>
                                <p className="font-medium">Địa chỉ</p>
                                <p className="text-sm text-muted-foreground">
                                    {contract.room?.property?.address || "—"}
                                </p>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Financial Terms */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Tiền thuê hàng tháng</p>
                            <p className="text-lg font-bold text-primary">
                                {contract.monthlyRent?.toLocaleString("vi-VN")} đ
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Tiền cọc</p>
                            <p className="text-lg font-bold">
                                {contract.deposit?.toLocaleString("vi-VN")} đ
                            </p>
                        </div>
                    </div>

                    {/* Duration */}
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                            <p className="text-sm text-muted-foreground">Thời hạn hợp đồng</p>
                            <p className="font-medium">
                                {format(new Date(contract.startDate), "dd/MM/yyyy")} -{" "}
                                {format(new Date(contract.endDate), "dd/MM/yyyy")}
                            </p>
                        </div>
                    </div>

                    {/* Payment Day */}
                    <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <div>
                            <p className="text-sm text-muted-foreground">Ngày thu tiền hàng tháng</p>
                            <p className="font-medium">Ngày {contract.paymentDay || 5} mỗi tháng</p>
                        </div>
                    </div>

                    <Separator />

                    {/* Terms */}
                    <div className="space-y-2">
                        <h3 className="font-semibold">Điều khoản hợp đồng</h3>
                        <div className="rounded-lg border bg-muted/30 p-4 max-h-48 overflow-y-auto text-sm space-y-2">
                            {contract.terms ? (
                                <p className="whitespace-pre-wrap">{contract.terms}</p>
                            ) : (
                                <ul className="space-y-1 list-disc list-inside">
                                    <li>Người thuê cam kết giữ gìn tài sản, không làm hư hại</li>
                                    <li>Thanh toán tiền thuê đúng hạn vào ngày {contract.paymentDay || 5} mỗi tháng</li>
                                    <li>Thông báo trước 30 ngày nếu muốn chấm dứt hợp đồng</li>
                                    <li>Không được chuyển nhượng hợp đồng cho bên thứ ba</li>
                                    <li>Tuân thủ các quy định về an ninh, vệ sinh chung</li>
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* Confirmation */}
                    <div className="flex items-start space-x-2 rounded-lg border border-primary/20 bg-primary/5 p-4">
                        <Checkbox
                            id="agree"
                            checked={agreed}
                            onCheckedChange={(checked) => setAgreed(checked as boolean)}
                        />
                        <Label
                            htmlFor="agree"
                            className="text-sm font-medium leading-relaxed cursor-pointer"
                        >
                            Tôi đã đọc và đồng ý với tất cả các điều khoản trong hợp đồng này. Tôi hiểu rằng sau khi phê duyệt, tôi cần thanh toán tiền cọc để kích hoạt hợp đồng.
                        </Label>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={approveMutation.isPending}
                    >
                        Hủy
                    </Button>
                    <Button
                        onClick={handleApprove}
                        disabled={!agreed || approveMutation.isPending}
                        className="gap-2"
                    >
                        {approveMutation.isPending ? "Đang xử lý..." : "Phê duyệt hợp đồng"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
