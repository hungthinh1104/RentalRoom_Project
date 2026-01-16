"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ReactNode } from "react";

export interface TimelineEvent {
    id: string | number;
    title: string;
    description?: string;
    timestamp?: string;
    icon?: ReactNode;
    status?: "completed" | "current" | "upcoming";
    content?: ReactNode;
}

interface TimelineProps {
    events: TimelineEvent[];
    className?: string;
    variant?: "default" | "compact";
}

/**
 * Timeline Component - 2026 UI Standard
 * 
 * Vertical timeline with:
 * - Staggered entrance animations
 * - Status indicators (completed, current, upcoming)
 * - Icon support
 * - Glassmorphic cards
 * 
 * @example
 * ```tsx
 * <Timeline 
 *   events={[
 *     { id: 1, title: "Created", status: "completed", timestamp: "2 days ago" },
 *     { id: 2, title: "In Progress", status: "current" },
 *     { id: 3, title: "Completed", status: "upcoming" }
 *   ]} 
 * />
 * ```
 */
export function Timeline({ events, className, variant = "default" }: TimelineProps) {
    return (
        <div className={cn("space-y-4", className)}>
            {events.map((event, index) => (
                <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                        delay: index * 0.1,
                        duration: 0.3,
                        ease: "easeOut"
                    }}
                    className="flex gap-4"
                >
                    {/* Timeline Track */}
                    <div className="flex flex-col items-center">
                        {/* Status Dot */}
                        <div className={cn(
                            "flex items-center justify-center rounded-full shrink-0 transition-all duration-200",
                            variant === "compact" ? "w-8 h-8" : "w-10 h-10",
                            event.status === "completed" && "bg-success/20 border-2 border-success",
                            event.status === "current" && "bg-primary/20 border-2 border-primary ring-4 ring-primary/10",
                            event.status === "upcoming" && "bg-muted/20 border-2 border-muted-foreground/30",
                            !event.status && "bg-secondary/20 border-2 border-border"
                        )}>
                            {event.icon || (
                                <div className={cn(
                                    "w-3 h-3 rounded-full",
                                    event.status === "completed" && "bg-success",
                                    event.status === "current" && "bg-primary animate-pulse",
                                    event.status === "upcoming" && "bg-muted-foreground/50",
                                    !event.status && "bg-foreground/50"
                                )} />
                            )}
                        </div>

                        {/* Connecting Line */}
                        {index !== events.length - 1 && (
                            <div className={cn(
                                "w-0.5 flex-1 min-h-12 transition-colors duration-200",
                                event.status === "completed" ? "bg-success/30" : "bg-border/50"
                            )} />
                        )}
                    </div>

                    {/* Content Card */}
                    <div className="flex-1 pb-8">
                        <div className={cn(
                            "bg-[var(--glass-bg)] backdrop-blur-md",
                            "border border-[var(--glass-border)]",
                            "rounded-2xl p-5",
                            "hover:shadow-lg transition-shadow duration-200"
                        )}>
                            {/* Header */}
                            <div className="flex items-start justify-between gap-4 mb-2">
                                <h4 className="font-semibold text-foreground">
                                    {event.title}
                                </h4>
                                {event.timestamp && (
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                        {event.timestamp}
                                    </span>
                                )}
                            </div>

                            {/* Description */}
                            {event.description && (
                                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                                    {event.description}
                                </p>
                            )}

                            {/* Custom Content */}
                            {event.content && (
                                <div className="mt-4">
                                    {event.content}
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}

/**
 * Compact Timeline Item - For simpler use cases
 */
export function TimelineItem({
    title,
    description,
    timestamp,
    status = "completed"
}: Omit<TimelineEvent, 'id'>) {
    return (
        <div className="flex gap-3 items-start">
            <div className={cn(
                "w-2 h-2 rounded-full mt-1.5 shrink-0",
                status === "completed" && "bg-success",
                status === "current" && "bg-primary animate-pulse",
                status === "upcoming" && "bg-muted-foreground/50"
            )} />
            <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                    <p className="font-medium text-sm text-foreground truncate">
                        {title}
                    </p>
                    {timestamp && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {timestamp}
                        </span>
                    )}
                </div>
                {description && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {description}
                    </p>
                )}
            </div>
        </div>
    );
}
