"use client";

import { format } from "date-fns";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePayments, useCheckPaymentStatus } from "@/features/payments/hooks/use-payments";
import { PaymentStatus, type Payment } from "@/types";
import { CreditCard, Receipt, Clock3, CheckCircle2, XCircle, Wallet } from "lucide-react";
import { useState } from "react";

const paymentStatusCopy: Record<PaymentStatus, { label: string; color: string; icon: typeof CreditCard }> = {
[PaymentStatus.PENDING]: { label: "Chờ thanh toán", color: "bg-warning-light text-warning border-warning/20", icon: Clock3 },
[PaymentStatus.COMPLETED]: { label: "Đã thanh toán", color: "bg-success-light text-success border-success/20", icon: CheckCircle2 },
[PaymentStatus.FAILED]: { label: "Thất bại", color: "bg-destructive-light text-destructive border-destructive/20", icon: XCircle },
};

function formatDate(value?: string | null) {
return value ? format(new Date(value), "dd/MM/yyyy") : "—";
}

export default function TenantPaymentsPage() {
const { data: session } = useSession();
const tenantId = session?.user?.id;
const paymentsQuery = usePayments(tenantId ? { tenantId } : undefined);
const payments = paymentsQuery.data?.data ?? paymentsQuery.data?.items ?? [];

const checkPaymentMutation = useCheckPaymentStatus();
const [lastCheckMap, setLastCheckMap] = useState<Record<string, number>>({});

const handleCheckStatus = (id: string) => {
const now = performance.now();
if (lastCheckMap[id] && now - lastCheckMap[id] < 60000) {
return; // Rate limit (client side check as backup)
}

checkPaymentMutation.mutate(id, {
onSuccess: (data: { success: boolean }) => {
if (data.success) {
// Update last check time
setLastCheckMap((prev) => ({ ...prev, [id]: Date.now() }));
}
},
});
// Optimistically update timestamp to prevent double click immediately
setLastCheckMap((prev) => ({ ...prev, [id]: Date.now() }));
};

return (
<div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-6">
<div className="flex flex-col gap-3">
<h1 className="text-3xl font-bold text-foreground">Thanh toán</h1>
<p className="text-muted-foreground text-sm">Kiểm tra hóa đơn, trạng thái thanh toán và thực hiện thanh toán an toàn.</p>
</div>

<Card className="border border-border/70 bg-gradient-to-br from-card/90 via-card/70 to-muted/60 backdrop-blur-xl rounded-[32px] shadow-xl shadow-muted/30">
<CardHeader className="pb-0 flex items-center justify-between">
<CardTitle className="flex items-center gap-2 text-lg font-semibold">
<CreditCard className="h-5 w-5 text-primary" />
Hóa đơn & thanh toán
</CardTitle>
<Badge variant="secondary" className="text-xs">Bảo mật SSL</Badge>
</CardHeader>
<CardContent className="pt-4 space-y-4">
{paymentsQuery.isLoading && (
<div className="space-y-3">
{[...Array(3)].map((_, idx) => (
<Skeleton key={idx} className="h-24 w-full rounded-3xl" />
))}
</div>
)}

{!paymentsQuery.isLoading && payments.length === 0 && (
<div className="rounded-3xl border border-dashed border-border/80 p-8 text-center space-y-3">
<div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
<Receipt className="h-6 w-6 text-muted-foreground" />
</div>
<div>
<p className="font-semibold">Chưa có hóa đơn</p>
<p className="text-sm text-muted-foreground">Khi có hóa đơn mới, chúng tôi sẽ thông báo ngay cho bạn.</p>
</div>
</div>
)}

{!paymentsQuery.isLoading && payments.map((payment: Payment) => {
const status = payment.status ? paymentStatusCopy[payment.status] : paymentStatusCopy[PaymentStatus.PENDING];
const StatusIcon = status.icon;
const lastCheck = lastCheckMap[payment.id] || 0;
const isRateLimited = performance.now() - lastCheck < 60000;
return (
<Card key={payment.id} className="hover:shadow-md transition-all border border-border/50">
<CardContent className="pt-6">
<div className="flex items-center justify-between gap-3 flex-wrap">
<div className="flex items-center gap-3">
<div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-semibold ring-1 ring-primary/20">
{payment.invoiceId ? `HD` : `TT`}
</div>
<div>
<p className="font-semibold text-base md:text-lg">Hóa đơn {payment.invoiceId ?? payment.id}</p>
<p className="text-sm text-muted-foreground">Ngày tạo: {formatDate(payment.paymentDate)}</p>
</div>
</div>
<Badge className={`border ${status.color} gap-1 rounded-full px-3 py-1 text-xs font-semibold`}>
<StatusIcon className="h-4 w-4" />
{status.label}
</Badge>
</div>

<div className="flex items-center justify-between gap-3 flex-wrap text-sm text-muted-foreground">
<div className="flex items-center gap-2">
<Wallet className="h-4 w-4" />
<span>Số tiền: {payment.amount ? `${payment.amount.toLocaleString('vi-VN')}đ` : '—'}</span>
</div>
<div className="flex items-center gap-2 text-primary font-semibold">
{payment.status !== PaymentStatus.COMPLETED && (
<Button
size="sm"
variant="ghost"
className="gap-2 text-muted-foreground hover:text-primary"
disabled={checkPaymentMutation.isPending || isRateLimited}
onClick={() => handleCheckStatus(payment.id)}
>
<CheckCircle2 className="h-4 w-4" />
{isRateLimited ? 'Đợi 1p...' : 'Kiểm tra'}
</Button>
)}
<Button size="sm" variant="outline" className="gap-2">
Thanh toán
<CreditCard className="h-4 w-4" />
</Button>
</div>
</div>
</CardContent>
</Card>
);
	})}
			</CardContent>
		</Card>
	</div>
	);
}
