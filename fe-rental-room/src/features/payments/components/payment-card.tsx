import { Calendar, DollarSign, CreditCard, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Payment } from "@/types";
import { PaymentStatus, PaymentMethod } from "@/types/enums";

interface PaymentCardProps {
  payment: Payment;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getStatusIcon(status: PaymentStatus) {
  switch (status) {
    case PaymentStatus.COMPLETED:
      return <CheckCircle2 className="size-4 text-success" />;
    case PaymentStatus.PENDING:
      return <Clock className="size-4 text-warning" />;
    case PaymentStatus.FAILED:
      return <XCircle className="size-4 text-destructive" />;
    default:
      return <Clock className="size-4" />;
  }
}

function getStatusVariant(status: PaymentStatus): "default" | "secondary" {
  switch (status) {
    case PaymentStatus.COMPLETED:
      return "default";
    case PaymentStatus.PENDING:
    case PaymentStatus.FAILED:
      return "secondary";
    default:
      return "secondary";
  }
}

function getMethodLabel(method: PaymentMethod): string {
  const labels: Record<PaymentMethod, string> = {
    [PaymentMethod.CASH]: "Cash",
    [PaymentMethod.BANK_TRANSFER]: "Bank Transfer",
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
        <div className="flex items-center gap-2">
          {getStatusIcon(payment.status)}
          <div>
            <p className="font-semibold">Payment #{payment.id.slice(0, 8)}</p>
            <p className="text-sm text-muted-foreground">
              Invoice #{payment.invoice?.id.slice(0, 8)}
            </p>
          </div>
        </div>
        <Badge variant={getStatusVariant(payment.status)}>
          {payment.status}
        </Badge>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex items-center gap-2">
          <DollarSign className="size-4 text-muted-foreground" />
          <span className="text-muted-foreground">Amount:</span>
          <span className="font-bold text-primary text-lg ml-auto">
            ${payment.amount.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <CreditCard className="size-4 text-muted-foreground" />
          <span className="text-muted-foreground">Method:</span>
          <span className="font-medium ml-auto">{getMethodLabel(payment.paymentMethod)}</span>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="size-4 text-muted-foreground" />
          <span className="text-muted-foreground">Date:</span>
          <span className="font-medium ml-auto">{formatDate(payment.paymentDate)}</span>
        </div>

        {payment.transactionId && (
          <div className="pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground">Transaction ID</p>
            <p className="font-mono text-xs mt-1">{payment.transactionId}</p>
          </div>
        )}
      </div>
      </CardContent>
    </Card>
  );
}
