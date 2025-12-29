"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";
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
import { reviewReplyApi } from "../api";
import { toast } from "sonner";

interface ReviewReplyFormProps {
    reviewId: string;
    reviewerName?: string;
    onSuccess?: () => void;
}

export function ReviewReplyForm({
    reviewId,
    reviewerName,
    onSuccess,
}: ReviewReplyFormProps) {
    const [open, setOpen] = useState(false);
    const [reply, setReply] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!reply.trim()) {
            toast.error("Vui lòng nhập phản hồi");
            return;
        }

        try {
            setIsSubmitting(true);
            await reviewReplyApi.replyToReview(reviewId, {
                landlordReply: reply,
            });
            toast.success("Phản hồi đã được gửi!");
            setOpen(false);
            setReply("");
            onSuccess?.();
        } catch {
            toast.error("Không thể gửi phản hồi. Vui lòng thử lại.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
                <MessageSquare className="size-4 mr-2" />
                Phản hồi
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Phản hồi đánh giá</DialogTitle>
                        <DialogDescription>
                            {reviewerName
                                ? `Phản hồi đánh giá của ${reviewerName}`
                                : "Phản hồi đánh giá của khách thuê"}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="reply">Phản hồi của bạn</Label>
                            <Textarea
                                id="reply"
                                placeholder="Cảm ơn bạn đã đánh giá. Chúng tôi rất vui vì..."
                                value={reply}
                                onChange={(e) => setReply(e.target.value)}
                                className="min-h-[120px] resize-none"
                            />
                            <p className="text-xs text-muted-foreground">
                                Phản hồi của bạn sẽ hiển thị công khai cho tất cả người dùng
                            </p>
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
                        <Button onClick={handleSubmit} disabled={isSubmitting || !reply.trim()}>
                            {isSubmitting ? "Đang gửi..." : "Gửi phản hồi"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
