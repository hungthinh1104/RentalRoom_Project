import { ContractStatus } from "@/types/enums";
import { Check, Circle, CreditCard, FileSignature, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContractStepperProps {
    status: ContractStatus;
}

export function ContractStepper({ status }: ContractStepperProps) {
    const steps = [
        {
            id: "review",
            label: "Xem xét",
            icon: FileText,
            isActive: (s: ContractStatus) =>
                [ContractStatus.DRAFT, ContractStatus.PENDING_SIGNATURE, ContractStatus.DEPOSIT_PENDING, ContractStatus.ACTIVE].includes(s),
            isCompleted: (s: ContractStatus) =>
                [ContractStatus.DEPOSIT_PENDING, ContractStatus.ACTIVE].includes(s),
        },
        {
            id: "sign",
            label: "Ký hợp đồng",
            icon: FileSignature,
            isActive: (s: ContractStatus) =>
                [ContractStatus.PENDING_SIGNATURE, ContractStatus.DEPOSIT_PENDING, ContractStatus.ACTIVE].includes(s),
            isCompleted: (s: ContractStatus) =>
                [ContractStatus.DEPOSIT_PENDING, ContractStatus.ACTIVE].includes(s),
        },
        {
            id: "deposit",
            label: "Thanh toán cọc",
            icon: CreditCard,
            isActive: (s: ContractStatus) =>
                [ContractStatus.DEPOSIT_PENDING, ContractStatus.ACTIVE].includes(s),
            isCompleted: (s: ContractStatus) =>
                [ContractStatus.ACTIVE].includes(s),
        },
        {
            id: "active",
            label: "Hoàn tất",
            icon: Check,
            isActive: (s: ContractStatus) => [ContractStatus.ACTIVE].includes(s),
            isCompleted: (s: ContractStatus) => [ContractStatus.ACTIVE].includes(s),
        },
    ];

    return (
        <div className="w-full py-4">
            <div className="relative flex items-center justify-between w-full">
                <div className="absolute left-0 top-1/2 w-full h-1 bg-muted -z-10 rounded-full" />

                {steps.map((step, index) => {
                    const active = step.isActive(status);
                    const completed = step.isCompleted(status);
                    const current = active && !completed; // Currently working on this step (mostly)

                    // Special case for "Sign" step: It's "Current" if PENDING_SIGNATURE
                    // Special case for "Deposit" step: It's "Current" if DEPOSIT_PENDING

                    let state = "inactive";
                    if (completed) state = "completed";
                    else if (active) state = "active";

                    // Refined State Logic for UI
                    const isCurrentStep =
                        (step.id === "review" && status === ContractStatus.DRAFT) ||
                        (step.id === "sign" && status === ContractStatus.PENDING_SIGNATURE) ||
                        (step.id === "deposit" && status === ContractStatus.DEPOSIT_PENDING) ||
                        (step.id === "active" && status === ContractStatus.ACTIVE);

                    // Override completed logic for previous steps
                    const isFinished = completed;

                    return (
                        <div key={step.id} className="flex flex-col items-center bg-background px-2">
                            <div
                                className={cn(
                                    "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300",
                                    isFinished
                                        ? "bg-success border-success text-success-foreground"
                                        : isCurrentStep
                                            ? "bg-info border-info text-info-foreground ring-4 ring-info/10"
                                            : "bg-background border-border text-muted-foreground"
                                )}
                            >
                                {isFinished ? (
                                    <Check className="w-5 h-5" />
                                ) : (
                                    <step.icon className="w-5 h-5" />
                                )}
                            </div>
                            <span
                                className={cn(
                                    "mt-2 text-xs font-medium uppercase tracking-wider",
                                    isFinished ? "text-success" : isCurrentStep ? "text-info" : "text-muted-foreground"
                                )}
                            >
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
