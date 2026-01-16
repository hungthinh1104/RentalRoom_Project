"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Loader2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import api from "@/lib/api/client";

interface PaymentStatusPollerProps {
    contractId: string;
    accountNumber: string;
    bankName: string;
    amount: number;
    paymentRef: string; // The content syntax e.g. "HD123456"
    deadline: Date;
    onSuccess?: () => void;
}

interface PaymentStatusResponse {
    success: boolean;
    status: "DEPOSIT_PENDING" | "ACTIVE" | "CANCELLED" | "EXPIRED";
}

export function PaymentStatusPoller({
    contractId,
    accountNumber,
    bankName,
    amount,
    paymentRef,
    deadline,
    onSuccess
}: PaymentStatusPollerProps) {
    const router = useRouter();
    const [timeLeft, setTimeLeft] = useState<string>("");

    // Poll payment status every 5 seconds
    const { data } = useQuery({
        queryKey: ["contract-payment-status", contractId],
        queryFn: async (): Promise<PaymentStatusResponse> => {
            const res = await api.get<PaymentStatusResponse>(`/contracts/${contractId}/payment-status`);
            return res.data;
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        refetchInterval: (query: any) => {
            const status = query.state.data?.status;
            // Stop polling if active or cancelled
            if (status === "ACTIVE" || status === "CANCELLED" || status === "EXPIRED") {
                return false;
            }
            return 5000; // 5 seconds
        },
    });

    useEffect(() => {
        if (data?.status === "ACTIVE") {
            toast.success("Thanh toán thành công! Hợp đồng đã được kích hoạt.");
            onSuccess?.();
            router.refresh();
        }
    }, [data?.status, onSuccess, router]);

    // Countdown Timer
    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            const end = new Date(deadline);
            const diff = end.getTime() - now.getTime();

            if (diff <= 0) {
                setTimeLeft("Đã hết hạn");
                clearInterval(interval);
                return;
            }

            const h = Math.floor(diff / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);
            setTimeLeft(`${h}h ${m}m ${s}s`);
        }, 1000);

        return () => clearInterval(interval);
    }, [deadline]);

    // Copy to clipboard
    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`Đã sao chép ${label}`);
    };

    // Helper to map bank names to SePay supported codes/names
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
    };

    // QR Code URL (using SePay)
    // Structure: https://qr.sepay.vn/img?acc=ACCOUNT&bank=BANK&amount=AMOUNT&des=CONTENT&template=compact
    const bankCode = getBankCode(bankName);
    const qrDescription = paymentRef; // Noi dung chuyen khoan
    const qrUrl = `https://qr.sepay.vn/img?bank=${encodeURIComponent(bankCode)}&acc=${encodeURIComponent(accountNumber)}&template=compact&amount=${amount}&des=${encodeURIComponent(qrDescription)}`;

    if (data?.status === "ACTIVE") {
        return (
            <Card className="border-green-200 bg-green-50 dark:bg-green-900/10">
                <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-600 dark:text-green-400">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-green-700 dark:text-green-400">Thanh toán thành công</h3>
                        <p className="text-muted-foreground">Hợp đồng đã được kích hoạt.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-2xl mx-auto shadow-lg border-2 border-primary/20">
            <CardHeader className="text-center border-b bg-muted/30">
                <CardTitle className="text-2xl text-primary">Thanh Toán Đặt Cọc</CardTitle>
                <CardDescription>
                    Vui lòng chuyển khoản đúng nội dung để hệ thống tự động kích hoạt
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 p-6">

                {/* Timer Alert */}
                <Alert variant="default" className="bg-amber-50 dark:bg-amber-950/30 border-amber-200">
                    <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
                    <AlertTitle className="text-amber-800 dark:text-amber-500">Đang chờ thanh toán</AlertTitle>
                    <AlertDescription className="text-amber-700 dark:text-amber-400">
                        Hợp đồng sẽ bị hủy sau: <span className="font-bold font-mono text-lg">{timeLeft}</span>
                    </AlertDescription>
                </Alert>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* QR Code */}
                    <div className="flex flex-col items-center justify-center space-y-3 p-4 bg-white rounded-xl border shadow-sm">
                        <div className="relative w-48 h-48">
                            <Image
                                src={qrUrl}
                                alt="SePay QR Code"
                                fill
                                className="object-contain"
                                unoptimized
                            />
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                            Quét mã bằng ứng dụng ngân hàng<br />hoặc Ví điện tử
                        </p>
                    </div>

                    {/* Transfer Info */}
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase text-muted-foreground">Ngân hàng</label>
                            <div className="text-lg font-medium">{bankName} ({bankCode})</div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase text-muted-foreground">Số tài khoản</label>
                            <div className="flex items-center gap-2">
                                <span className="text-xl font-mono font-bold tracking-wide">{accountNumber}</span>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(accountNumber, "số tài khoản")}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase text-muted-foreground">Số tiền</label>
                            <div className="flex items-center gap-2">
                                <span className="text-xl font-bold text-primary">
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)}
                                </span>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(amount.toString(), "số tiền")}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-1 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                            <label className="text-xs font-semibold uppercase text-blue-600 dark:text-blue-400">Nội dung chuyển khoản (Bắt buộc)</label>
                            <div className="flex items-center justify-between gap-2 mt-1">
                                <span className="text-lg font-mono font-bold text-blue-700 dark:text-blue-300">{paymentRef}</span>
                                <Button variant="secondary" size="sm" onClick={() => copyToClipboard(paymentRef, "nội dung")}>
                                    <Copy className="h-3.5 w-3.5 mr-1.5" />
                                    Sao chép
                                </Button>
                            </div>
                            <p className="text-[10px] text-blue-500 mt-1">
                                * Hệ thống tự động xác nhận dựa trên nội dung này. Vui lòng điền chính xác.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="text-center text-sm text-muted-foreground pt-4 border-t">
                    Hệ thống sẽ tự động cập nhật trạng thái trong vòng 30 giây sau khi chuyển khoản thành công.
                </div>

            </CardContent>
        </Card>
    );
}
