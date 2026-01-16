"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { maintenanceFeedbackApi } from "../api";
import { toast } from "sonner";

interface MaintenanceFeedbackButtonProps {
    requestId: string;
    onSuccess?: () => void;
}

export function MaintenanceFeedbackButton({
    requestId,
    onSuccess,
}: MaintenanceFeedbackButtonProps) {
    const [open, setOpen] = useState(false);
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [feedback, setFeedback] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) {
            toast.error("Vui lòng chọn đánh giá");
            return;
        }

        try {
            setIsSubmitting(true);
            await maintenanceFeedbackApi.submitFeedback(requestId, {
                rating,
                feedback,
            });
            toast.success("Cảm ơn bạn đã đánh giá!");
            setOpen(false);
            setRating(0);
            setFeedback("");
            onSuccess?.();
        } catch {
            toast.error("Không thể gửi đánh giá. Vui lòng thử lại.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
                <Star className="size-4 mr-2" />
                Đánh giá
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Đánh giá dịch vụ bảo trì</DialogTitle>
                        <DialogDescription>
                            Chia sẻ trải nghiệm của bạn về dịch vụ bảo trì
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Star Rating */}
                        <div className="space-y-2">
                            <Label>Đánh giá của bạn</Label>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        onMouseEnter={() => setHoveredRating(star)}
                                        onMouseLeave={() => setHoveredRating(0)}
                                        className="transition-transform hover:scale-110"
                                    >
                                        <Star
                                            className={`size-8 ${star <= (hoveredRating || rating)
                                                ? "fill-yellow-400 text-yellow-400"
                                                : "text-muted-foreground"
                                                }`}
                                        />
                                    </button>
                                ))}
                            </div>
                            {rating > 0 && (
                                <p className="text-sm text-muted-foreground">
                                    {rating === 1 && "Rất tệ"}
                                    {rating === 2 && "Tệ"}
                                    {rating === 3 && "Bình thường"}
                                    {rating === 4 && "Tốt"}
                                    {rating === 5 && "Xuất sắc"}
                                </p>
                            )}
                        </div>

                        {/* Feedback Text */}
                        <div className="space-y-2">
                            <Label htmlFor="feedback">Nhận xét (tùy chọn)</Label>
                            <Textarea
                                id="feedback"
                                placeholder="Chia sẻ chi tiết về trải nghiệm của bạn..."
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                className="min-h-[100px] resize-none"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isSubmitting}
                        >
                            Hủy
                        </Button>
                        <Button onClick={handleSubmit} disabled={isSubmitting || rating === 0}>
                            {isSubmitting ? "Đang gửi..." : "Gửi đánh giá"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
