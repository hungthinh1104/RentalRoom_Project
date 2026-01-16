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
    className: "bg-green-100 text-green-700 border-green-200 hover:bg-green-100",
    icon: CheckCircle,
  },
  [PaymentStatus.PENDING]: {
    label: "Chờ thanh toán",
    className: "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100",
    icon: Clock,
  },
  [PaymentStatus.FAILED]: {
    label: "Thất bại",
    className: "bg-red-100 text-red-700 border-red-200 hover:bg-red-100",
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
    className: "bg-gray-100 text-gray-700 border-gray-200",
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

