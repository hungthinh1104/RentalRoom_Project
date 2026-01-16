"use client";

import { Label } from "@/components/ui/label";
import { PaymentMethod } from "@/types/enums";
import { CreditCard } from "lucide-react";

interface PaymentMethodSelectorProps {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  disabled?: boolean;
}

export function PaymentMethodSelector({ value, onChange, disabled }: PaymentMethodSelectorProps) {
  const methods = [
    { value: PaymentMethod.BANK_TRANSFER, label: "Chuyển khoản qua Sepay", icon: CreditCard },
  ];

  return (
    <div className="space-y-2">
      <Label>Payment Method</Label>
      <div className="grid grid-cols-2 gap-3">
        {methods.map((method) => {
          const Icon = method.icon;
          const isSelected = value === method.value;
          
          return (
            <button
              key={method.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(method.value)}
              className={`
                flex items-center gap-3 p-4 rounded-lg border-2 transition-all
                ${isSelected 
                  ? "border-primary bg-primary/5" 
                  : "border-border bg-background hover:border-primary/50"
                }
                ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              `}
            >
              <Icon className={`size-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`font-medium text-sm ${isSelected ? "text-primary" : ""}`}>
                {method.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
