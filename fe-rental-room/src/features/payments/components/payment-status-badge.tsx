import { Badge } from "@/components/ui/badge";
import { PaymentStatus } from "@/types/enums";

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
}

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  const variant = status === PaymentStatus.COMPLETED ? "default" : "secondary";
  
  return (
    <Badge variant={variant}>
      {status}
    </Badge>
  );
}
