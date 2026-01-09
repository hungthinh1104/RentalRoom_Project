import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CreditCard, Wallet, QrCode, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api/client";
import { toast } from "sonner";

interface Invoice {
    id: string;
    invoiceNumber: string;
    amount: number;
    dueDate: string;
    description?: string;
}

interface PaymentDialogProps {
    invoice: Invoice | null;
    open: boolean;
    onClose: () => void;
}

const PAYMENT_METHODS = [
    {
        id: "BANK_TRANSFER",
        label: "Chuyển khoản ngân hàng",
        icon: CreditCard,
        description: "Chuyển khoản qua ngân hàng",
    },
    {
        id: "CASH",
        label: "Tiền mặt",
        icon: Wallet,
        description: "Thanh toán trực tiếp bằng tiền mặt",
    },
    {
        id: "QR_CODE",
        label: "Quét mã QR",
        icon: QrCode,
        description: "Thanh toán qua ví điện tử",
    },
];

export function PaymentDialog({ invoice, open, onClose }: PaymentDialogProps) {
    const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
    const queryClient = useQueryClient();

    const paymentMutation = useMutation({
        mutationFn: async () => {
            if (!invoice) throw new Error("No invoice");
            const { data } = await api.patch(`/billing/invoices/${invoice.id}/mark-paid`, {
                paymentMethod,
            });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tenant-invoices"] });
            queryClient.invalidateQueries({ queryKey: ["tenant-payment-stats"] });
            toast.success("Đã xác nhận thanh toán", {
                description: `Hóa đơn ${invoice?.invoiceNumber} đã được thanh toán`,
            });
            onClose();
        },
        onError: (error: any) => {
            toast.error("Không thể thanh toán", {
                description: error?.message || "Vui lòng thử lại sau",
            });
        },
    });

    const handleConfirm = () => {
        paymentMutation.mutate();
    };

    if (!invoice) return null;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Xác nhận thanh toán</DialogTitle>
                    <DialogDescription>
                        Xác nhận thanh toán cho hóa đơn {invoice.invoiceNumber}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Invoice Info */}
                    <div className="rounded-lg border p-4 space-y-2 bg-muted/50">
                        <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Mã hóa đơn</span>
                            <span className="font-medium">{invoice.invoiceNumber}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Số tiền</span>
                            <span className="text-lg font-bold text-primary">
                                {invoice.amount.toLocaleString()} đ
                            </span>
                        </div>
                        {invoice.description && (
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Mô tả</span>
                                <span className="text-sm">{invoice.description}</span>
                            </div>
                        )}
                    </div>

                    {/* Payment Method Selection */}
                    <div className="space-y-3">
                        <Label>Phương thức thanh toán</Label>
                        <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                            {PAYMENT_METHODS.map((method) => {
                                const Icon = method.icon;
                                return (
                                    <div
                                        key={method.id}
                                        className="flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                                        onClick={() => setPaymentMethod(method.id)}
                                    >
                                        <RadioGroupItem value={method.id} id={method.id} />
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="p-2 rounded-lg bg-primary/10">
                                                <Icon className="h-5 w-5 text-primary" />
                                            </div>
                                            <div className="flex-1">
                                                <Label htmlFor={method.id} className="cursor-pointer font-medium">
                                                    {method.label}
                                                </Label>
                                                <p className="text-sm text-muted-foreground">
                                                    {method.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </RadioGroup>
                    </div>

                    {/* Note */}
                    <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-3">
                        <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">Lưu ý:</p>
                        <p className="text-blue-800 dark:text-blue-200">
                            Sau khi xác nhận, hóa đơn sẽ được đánh dấu là đã thanh toán.
                            Vui lòng đảm bảo bạn đã thực hiện thanh toán trước khi xác nhận.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={paymentMutation.isPending}>
                        Hủy
                    </Button>
                    <Button onClick={handleConfirm} disabled={paymentMutation.isPending}>
                        {paymentMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Xác nhận thanh toán
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
