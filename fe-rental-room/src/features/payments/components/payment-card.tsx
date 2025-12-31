import { Calendar, Banknote, CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Payment } from "@/types";
import { PaymentMethod } from "@/types/enums";
import { PaymentStatusBadge } from "./payment-status-badge";

interface PaymentCardProps {
  payment: Payment;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}



function getMethodLabel(method: PaymentMethod): string {
  const labels: Record<PaymentMethod, string> = {
    [PaymentMethod.CASH]: "Tiền mặt",
    [PaymentMethod.BANK_TRANSFER]: "Chuyển khoản",
    [PaymentMethod.MOMO]: "MoMo",
    [PaymentMethod.ZALOPAY]: "ZaloPay",
  };
  return labels[method] || method;
}

export function PaymentCard({ payment }: PaymentCardProps) {
  return (
    <Card className="flex flex-col group hover:shadow-[0_20px_50px_rgba(0,0,0,0.15)] transition-all duration-300">
      <CardContent className="px-5 flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="font-semibold">Thanh toán #{payment.id.slice(0, 8)}</p>
            <p className="text-sm text-muted-foreground">
              Hóa đơn #{payment.invoice?.id.slice(0, 8)}
            </p>
          </div>
          <PaymentStatusBadge status={payment.status} size="sm" />
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <Banknote className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">Số tiền:</span>
            <span className="font-bold text-primary text-lg ml-auto">
              {formatCurrency(payment.amount)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <CreditCard className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">Phương thức:</span>
            <span className="font-medium ml-auto">{getMethodLabel(payment.paymentMethod)}</span>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">Ngày thanh toán:</span>
            <span className="font-medium ml-auto">{formatDate(payment.paymentDate)}</span>
          </div>

          {payment.transactionId && (
            <div className="pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground">Mã giao dịch</p>
              <p className="font-mono text-xs mt-1">{payment.transactionId}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
