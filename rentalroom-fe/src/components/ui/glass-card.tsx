import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlassCardProps {
    children: ReactNode;
    className?: string;
    glowColor?: "primary" | "secondary" | "accent";
    enableHover?: boolean;
}

/**
 * GlassCard Component - 2026 UI Standard
 * 
 * Premium glassmorphic card with:
 * - Frosted glass effect (backdrop-blur)
 * - Animated decorative glow
 * - Hover elevation
 * - Responsive rounded corners
 * 
 * @example
 * ```tsx
 * <GlassCard glowColor="primary">
 *   <h3>Feature Title</h3>
 *   <p>Description</p>
 * </GlassCard>
 * ```
 */
export function GlassCard({
    children,
    className,
    glowColor = "primary",
    enableHover = true
}: GlassCardProps) {
    const glowColors = {
        primary: "bg-primary/20",
        secondary: "bg-secondary/20",
        accent: "bg-accent/20"
    };

    return (
        <div className={cn(
            // Base glassmorphism
            "bg-[var(--glass-bg)] backdrop-blur-xl",
            "border border-[var(--glass-border)]",
            "rounded-[32px] p-8 shadow-2xl",

            // Layout
            "relative overflow-hidden",

            // Hover effects (if enabled)
            enableHover && "group/glass transition-all duration-300",
            enableHover && "hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)]",

            className
        )}>
            {/* Decorative Glow - Animates on hover */}
            <div className={cn(
                "absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] -z-10",
                "transition-opacity duration-500",
                glowColors[glowColor],
                enableHover ? "opacity-40 group-hover/glass:opacity-70" : "opacity-50"
            )} />

            {/* Content */}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
}

/**
 * GlassCardHeader - Semantic header section
 */
export function GlassCardHeader({ children, className }: { children: ReactNode, className?: string }) {
    return (
        <div className={cn("mb-6", className)}>
            {children}
        </div>
    );
}

/**
 * GlassCardTitle - Typography-optimized title
 */
export function GlassCardTitle({ children, className }: { children: ReactNode, className?: string }) {
    return (
        <h3 className={cn("text-2xl font-bold text-foreground tracking-tight", className)}>
            {children}
        </h3>
    );
}

/**
 * GlassCardDescription - Muted description text
 */
export function GlassCardDescription({ children, className }: { children: ReactNode, className?: string }) {
    return (
        <p className={cn("text-muted-foreground leading-relaxed", className)}>
            {children}
        </p>
    );
}

/**
 * GlassCardContent - Main content area
 */
export function GlassCardContent({ children, className }: { children: ReactNode, className?: string }) {
    return (
        <div className={cn("space-y-4", className)}>
            {children}
        </div>
    );
}

/**
 * GlassCardFooter - Footer section (e.g., actions)
 */
export function GlassCardFooter({ children, className }: { children: ReactNode, className?: string }) {
    return (
        <div className={cn("mt-6 pt-6 border-t border-border/50 flex items-center gap-4", className)}>
            {children}
        </div>
    );
}
