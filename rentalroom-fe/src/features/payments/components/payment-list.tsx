import { Payment } from "@/types";
import { PaymentCard } from "./payment-card";

interface PaymentListProps {
  payments: Payment[];
  isLoading?: boolean;
}

export function PaymentList({ payments, isLoading }: PaymentListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-[280px] rounded-2xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">No payments found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {payments.map((payment) => (
        <PaymentCard key={payment.id} payment={payment} />
      ))}
    </div>
  );
}
