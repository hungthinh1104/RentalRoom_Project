"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useContract } from "@/features/contracts/hooks/use-contracts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CheckCircle, Copy, Clock, Phone, Mail, AlertCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { differenceInDays, differenceInHours, format } from "date-fns";

export default function ContractPaymentPage() {
    const params = useParams();
    const router = useRouter();
    const contractId = params.id as string;
    const { data: contract, isLoading, error } = useContract(contractId);
    const [timeLeft, setTimeLeft] = useState<string>("");

    // Calculate time remaining
    useEffect(() => {
        if (!contract?.depositDeadline) return;

        const updateTimer = () => {
            const deadline = new Date(contract.depositDeadline!);
            const now = new Date();
            const days = differenceInDays(deadline, now);
            const hours = differenceInHours(deadline, now) % 24;

            if (days < 0) {
                setTimeLeft("Đã quá hạn");
            } else if (days === 0) {
                setTimeLeft(`Còn ${hours} giờ`);
            } else {
                setTimeLeft(`Còn ${days} ngày ${hours} giờ`);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 60000); // Update every minute

        return () => clearInterval(interval);
    }, [contract?.depositDeadline]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Đã sao chép!");
    };

    if (isLoading) {
        return (
            <div className="container max-w-3xl py-8 space-y-6">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (error || !contract) {
        return (
            <div className="container max-w-3xl py-8">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        Không tìm thấy hợp đồng hoặc có lỗi xảy ra.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="container max-w-3xl py-8 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/tenant/contracts">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Thanh toán tiền cọc</h1>
                    <p className="text-muted-foreground">Hợp đồng {contract.contractNumber}</p>
                </div>
            </div>

            {/* Success Message */}
            <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription>
                    ✅ Hợp đồng đã được phê duyệt thành công! Vui lòng thanh toán tiền cọc để kích hoạt hợp đồng.
                </AlertDescription>
            </Alert>

            {/* Payment Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        💰 Thông tin thanh toán
                    </CardTitle>
                    <CardDescription>
                        Chuyển khoản với nội dung chính xác để hệ thống tự động xác nhận
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4">
                        <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
                            <div>
                                <p className="text-sm text-muted-foreground">Số tiền cần thanh toán</p>
                                <p className="text-2xl font-bold text-primary">
                                    {contract.deposit?.toLocaleString("vi-VN")} VNĐ
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
                            <div className="flex-1">
                                <p className="text-sm text-muted-foreground">Mã thanh toán</p>
                                <p className="text-xl font-mono font-bold">{contract.paymentRef || contract.contractNumber}</p>
                                <p className="text-xs text-destructive mt-1">⚠️ Nhập chính xác mã này vào nội dung chuyển khoản</p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(contract.paymentRef || contract.contractNumber)}
                            >
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>

                        {contract.depositDeadline && (
                            <div className="flex items-center justify-between p-4 rounded-lg border border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Hạn thanh toán</p>
                                        <p className="font-medium">
                                            {format(new Date(contract.depositDeadline), "dd/MM/yyyy HH:mm")}
                                        </p>
                                    </div>
                                </div>
                                <Badge variant="outline" className="text-orange-700 border-orange-300 dark:text-orange-400 dark:border-orange-600">
                                    {timeLeft}
                                </Badge>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Instructions */}
            <Card>
                <CardHeader>
                    <CardTitle>🏦 Hướng dẫn chuyển khoản</CardTitle>
                </CardHeader>
                <CardContent>
                    <ol className="space-y-3 list-decimal list-inside">
                        <li className="text-sm">
                            <span className="font-medium">Mở ứng dụng ngân hàng</span> của bạn
                        </li>
                        <li className="text-sm">
                            <span className="font-medium">Chuyển khoản</span> số tiền:{" "}
                            <span className="font-bold text-primary">
                                {contract.deposit?.toLocaleString("vi-VN")} VNĐ
                            </span>
                        </li>
                        <li className="text-sm">
                            <span className="font-medium">Nội dung chuyển khoản:</span>{" "}
                            <code className="px-2 py-1 rounded bg-muted font-mono">
                                {contract.paymentRef || contract.contractNumber}
                            </code>
                            <br />
                            <span className="text-destructive text-xs">
                                ⚠️ Quan trọng: Nhập chính xác mã này!
                            </span>
                        </li>
                        <li className="text-sm">
                            <span className="font-medium">Xác nhận</span> giao dịch
                        </li>
                    </ol>

                    <Separator className="my-4" />

                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                            ℹ️ Hệ thống tự động xác nhận thanh toán sau <strong>5-10 phút</strong>.
                            Hợp đồng sẽ được kích hoạt ngay sau khi thanh toán được xác nhận.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>

            {/* Landlord Contact */}
            <Card>
                <CardHeader>
                    <CardTitle>📞 Liên hệ hỗ trợ</CardTitle>
                    <CardDescription>
                        Nếu cần hỗ trợ, vui lòng liên hệ chủ nhà
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-lg">👤</span>
                        </div>
                        <div>
                            <p className="font-medium">{contract.landlord?.user?.fullName || "Chủ nhà"}</p>
                            <p className="text-sm text-muted-foreground">Chủ nhà</p>
                        </div>
                    </div>

                    {contract.landlord?.user?.email && (
                        <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <a
                                href={`mailto:${contract.landlord.user.email}`}
                                className="text-primary hover:underline"
                            >
                                {contract.landlord.user.email}
                            </a>
                        </div>
                    )}

                    {contract.landlord?.user?.phoneNumber && (
                        <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <a
                                href={`tel:${contract.landlord.user.phoneNumber}`}
                                className="text-primary hover:underline"
                            >
                                {contract.landlord.user.phoneNumber}
                            </a>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
                <Button variant="outline" asChild className="flex-1">
                    <Link href="/dashboard/tenant/contracts">
                        Quay lại danh sách
                    </Link>
                </Button>
                <Button asChild className="flex-1">
                    <Link href={`/dashboard/tenant/contracts/${contract.id}`}>
                        Xem chi tiết hợp đồng
                    </Link>
                </Button>
            </div>
        </div>
    );
}
