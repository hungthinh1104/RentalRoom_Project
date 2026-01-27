import { Badge } from "@/components/ui/badge";
import { PaymentStatus } from "@/types/enums";
import { cn } from "@/lib/utils";
import { CheckCircle, Clock, XCircle } from "lucide-react";

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  showIcon?: boolean;
  size?: "sm" | "md";
}

const statusConfig: Record<PaymentStatus, {
  label: string;
  className: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  [PaymentStatus.COMPLETED]: {
    label: "Đã thanh toán",
    className: "bg-success/10 text-success border-success/20 hover:bg-success/15",
    icon: CheckCircle,
  },
  [PaymentStatus.PENDING]: {
    label: "Chờ thanh toán",
    className: "bg-warning/10 text-warning border-warning/20 hover:bg-warning/15",
    icon: Clock,
  },
  [PaymentStatus.FAILED]: {
    label: "Thất bại",
    className: "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/15",
    icon: XCircle,
  },
};

export function PaymentStatusBadge({
  status,
  showIcon = true,
  size = "md"
}: PaymentStatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status,
    className: "bg-muted text-muted-foreground border-border",
    icon: Clock,
  };

  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium gap-1.5",
        size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-2.5 py-1",
        config.className
      )}
    >
      {showIcon && <Icon className={cn(size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5")} />}
      {config.label}
    </Badge>
  );
}

