"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { aiFeedbackApi } from "../api";
import { UserAiFeedback } from "../types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AiFeedbackButtonsProps {
    interactionId: string;
    onFeedbackSubmitted?: () => void;
    className?: string;
}

export function AiFeedbackButtons({
    interactionId,
    onFeedbackSubmitted,
    className,
}: AiFeedbackButtonsProps) {
    const [feedback, setFeedback] = useState<UserAiFeedback | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleFeedback = async (type: UserAiFeedback) => {
        if (isSubmitting) return;

        try {
            setIsSubmitting(true);
            await aiFeedbackApi.submitFeedback({
                interactionId,
                userFeedback: type,
            });
            setFeedback(type);
            toast.success("Cảm ơn phản hồi của bạn!");
            onFeedbackSubmitted?.();
        } catch {
            toast.error("Không thể gửi phản hồi");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <span className="text-xs text-muted-foreground">Hữu ích?</span>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFeedback(UserAiFeedback.HELPFUL)}
                disabled={isSubmitting || feedback !== null}
                className={cn(
                    "h-8 px-2",
                    feedback === UserAiFeedback.HELPFUL && "bg-green-100 text-green-700"
                )}
            >
                <ThumbsUp className="size-4" />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFeedback(UserAiFeedback.NOT_HELPFUL)}
                disabled={isSubmitting || feedback !== null}
                className={cn(
                    "h-8 px-2",
                    feedback === UserAiFeedback.NOT_HELPFUL && "bg-red-100 text-red-700"
                )}
            >
                <ThumbsDown className="size-4" />
            </Button>
        </div>
    );
}
