import { cn } from "@/lib/utils";
import { Input } from "./input";
import { Label } from "./label";
import type { LucideProps } from "lucide-react";

interface PremiumInputProps extends Omit<React.ComponentProps<"input">, 'className'> {
    label?: string;
    icon?: React.ElementType;
    helperText?: string;
    error?: string;
    containerClassName?: string;
    inputClassName?: string;
}

/**
 * PremiumInput Component - 2026 UI Standard
 * 
 * Enhanced input field with:
 * - Animated focus glow
 * - Icon support with color transition
 * - Helper text / error messages
 * - Large touch targets (h-12 = 48px)
 * - Premium glassmorphic styling
 * 
 * @example
 * ```tsx
 * <PremiumInput
 *   label="Email"
 *   icon={Mail}
 *   placeholder="name@example.com"
 *   error={errors.email?.message}
 * />
 * ```
 */
export function PremiumInput({
    label,
    icon: Icon,
    helperText,
    error,
    containerClassName,
    inputClassName,
    ...props
}: PremiumInputProps) {
    const hasError = Boolean(error);

    return (
        <div className={cn("space-y-2", containerClassName)}>
            {/* Label */}
            {label && (
                <Label
                    htmlFor={props.id}
                    className="text-sm font-medium ml-1 text-foreground"
                >
                    {label}
                </Label>
            )}

            {/* Input Container */}
            <div className="relative group/input">
                {/* Focus Glow Effect */}
                <div className={cn(
                    "absolute inset-0 rounded-2xl blur-sm transition-opacity duration-200",
                    "opacity-0 group-focus-within/input:opacity-100",
                    hasError
                        ? "bg-destructive/30"
                        : "bg-primary/20"
                )} />

                {/* Icon (if provided) */}
                {Icon && (
                    <Icon className={cn(
                        "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5",
                        "transition-colors duration-150",
                        hasError
                            ? "text-destructive"
                            : "text-muted-foreground group-focus-within/input:text-primary"
                    )} />
                )}

                {/* Input Field */}
                <Input
                    className={cn(
                        // Size & spacing
                        "h-12",
                        Icon ? "pl-12" : "pl-4",
                        "pr-4",

                        // Glassmorphic styling
                        "bg-secondary/30",
                        "border-input",
                        "rounded-2xl",

                        // Typography
                        "placeholder:text-muted-foreground/50",
                        "text-foreground",

                        // Focus states
                        "focus-visible:ring-0",
                        hasError
                            ? "border-destructive focus-visible:border-destructive"
                            : "focus-visible:border-primary",

                        // Hover
                        "hover:border-input/80",

                        // Transitions
                        "transition-all duration-200",

                        inputClassName
                    )}
                    {...props}
                />
            </div>

            {/* Helper Text or Error */}
            {(helperText || error) && (
                <p className={cn(
                    "text-xs ml-1 leading-relaxed",
                    hasError ? "text-destructive font-medium" : "text-muted-foreground"
                )}>
                    {error || helperText}
                </p>
            )}
        </div>
    );
}
