"use client";

import { PaymentStatusPoller } from "@/features/contracts/components/payment-status-poller";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function ContractPaymentPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    // Fetch contract details to get payment info
    const { data: contract, isLoading, error } = useQuery({
        queryKey: ["contract", id],
        queryFn: async () => {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contracts/${id}`, {
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("accessToken") || ""}`
                }
            });
            if (!res.ok) throw new Error("Failed to fetch contract");
            return res.json();
        },
        enabled: !!id,
    });

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Đang tải thông tin hợp đồng...</p>
            </div>
        );
    }

    if (error || !contract) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <p className="text-destructive font-medium">Không tìm thấy hợp đồng hoặc có lỗi xảy ra.</p>
                <Button variant="outline" onClick={() => router.back()}>Quay lại</Button>
            </div>
        );
    }

    // Determine Status
    if (contract.status === "ACTIVE") {
        return (
            <div className="container max-w-3xl py-10">
                <PaymentStatusPoller
                    contractId={id}
                    // Pass dummy or real data, poller handles "ACTIVE" state display
                    accountNumber={contract.landlord?.paymentConfig?.accountNumber || ""}
                    bankName={contract.landlord?.paymentConfig?.bankName || ""}
                    amount={contract.deposit}
                    paymentRef={contract.paymentRef}
                    deadline={new Date(contract.depositDeadline ?? new Date().toISOString())}
                    onSuccess={() => router.push(`/contracts/${id}`)}
                />
                <div className="mt-8 text-center">
                    <Button onClick={() => router.push(`/contracts/${id}`)}>
                        Xem chi tiết hợp đồng
                    </Button>
                </div>
            </div>
        );
    }

    // Ensure we have payment config
    if (!contract.landlord?.paymentConfig) {
        return (
            <div className="container max-w-3xl py-10 text-center">
                <p className="text-destructive">Chủ nhà chưa cấu hình thanh toán. Vui lòng liên hệ chủ nhà.</p>
                <Button className="mt-4" onClick={() => router.back()}>Quay lại</Button>
            </div>
        );
    }

    return (
        <div className="container max-w-3xl py-10 space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Thanh Toán Hợp Đồng</h1>
                <Button variant="outline" size="sm" onClick={() => router.push("/contracts")}>
                    Đóng
                </Button>
            </div>

            <PaymentStatusPoller
                contractId={id}
                accountNumber={contract.landlord.paymentConfig.accountNumber}
                bankName={contract.landlord.paymentConfig.bankName}
                amount={Number(contract.deposit)}
                paymentRef={contract.paymentRef}
                deadline={new Date(contract.depositDeadline)}
                onSuccess={() => {
                    // Redirect to detail page after success
                    setTimeout(() => router.push(`/contracts/${id}`), 2000);
                }}
            />
        </div>
    );
}
