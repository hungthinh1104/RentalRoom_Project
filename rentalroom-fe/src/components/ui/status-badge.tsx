"use client";

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const statusBadgeVariants = cva(
    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all duration-200",
    {
        variants: {
            variant: {
                default: "bg-secondary/80 text-secondary-foreground border border-border/50",
                success: "bg-success/10 text-success border border-success/20",
                warning: "bg-warning/10 text-warning border border-warning/20",
                destructive: "bg-destructive/10 text-destructive border border-destructive/20",
                info: "bg-info/10 text-info border border-info/20",
                primary: "bg-primary/10 text-primary border border-primary/20",
            },
            size: {
                sm: "px-2 py-0.5 text-[10px]",
                md: "px-3 py-1 text-xs",
                lg: "px-4 py-1.5 text-sm",
            },
            animated: {
                true: "hover:scale-105 active:scale-95",
                false: "",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "md",
            animated: false,
        },
    }
);

export interface StatusBadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusBadgeVariants> {
    pulse?: boolean;
    icon?: React.ReactNode;
}

/**
 * StatusBadge Component - 2026 UI Standard
 * 
 * Semantic status indicator with:
 * - Color-coded variants (success, warning, error, info)
 * - Optional animated pulse
 * - Icon support
 * - Micro-interaction hover effects
 * 
 * @example
 * ```tsx
 * <StatusBadge variant="success" pulse>
 *   Active
 * </StatusBadge>
 * 
 * <StatusBadge variant="warning" icon={<AlertCircle />}>
 *   Pending
 * </StatusBadge>
 * ```
 */
export function StatusBadge({
    className,
    variant,
    size,
    animated,
    pulse = false,
    icon,
    children,
    ...props
}: StatusBadgeProps) {
    return (
        <div
            className={cn(statusBadgeVariants({ variant, size, animated }), className)}
            {...props}
        >
            {/* Pulse Indicator */}
            {pulse && (
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
                </span>
            )}

            {/* Static Dot (if pulse is false but no icon) */}
            {!pulse && !icon && (
                <span className="w-2 h-2 rounded-full bg-current" />
            )}

            {/* Custom Icon */}
            {icon && (
                <span className="w-3.5 h-3.5 flex items-center justify-center">
                    {icon}
                </span>
            )}

            {/* Label */}
            {children}
        </div>
    );
}

/**
 * Preset Status Badges for common use cases
 */
export const ActiveBadge = ({ children = "Active", ...props }: Omit<StatusBadgeProps, 'variant'>) => (
    <StatusBadge variant="success" pulse {...props}>{children}</StatusBadge>
);

export const PendingBadge = ({ children = "Pending", ...props }: Omit<StatusBadgeProps, 'variant'>) => (
    <StatusBadge variant="warning" {...props}>{children}</StatusBadge>
);

export const InactiveBadge = ({ children = "Inactive", ...props }: Omit<StatusBadgeProps, 'variant'>) => (
    <StatusBadge variant="destructive" {...props}>{children}</StatusBadge>
);

export const DraftBadge = ({ children = "Draft", ...props }: Omit<StatusBadgeProps, 'variant'>) => (
    <StatusBadge variant="default" {...props}>{children}</StatusBadge>
);
