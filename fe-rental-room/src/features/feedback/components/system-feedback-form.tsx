"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { systemFeedbackApi } from "../api";
import { FeedbackType, FeedbackPriority } from "../types";

const feedbackSchema = z.object({
    type: z.nativeEnum(FeedbackType),
    title: z.string().min(5, "Tiêu đề phải có ít nhất 5 ký tự"),
    description: z.string().min(20, "Mô tả phải có ít nhất 20 ký tự"),
    priority: z.nativeEnum(FeedbackPriority),
});

type FeedbackFormData = z.infer<typeof feedbackSchema>;

interface SystemFeedbackFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SystemFeedbackForm({ open, onOpenChange }: SystemFeedbackFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<FeedbackFormData>({
        resolver: zodResolver(feedbackSchema),
        defaultValues: {
            type: FeedbackType.GENERAL,
            priority: FeedbackPriority.MEDIUM,
        },
    });

    const onSubmit = async (data: FeedbackFormData) => {
        try {
            setIsSubmitting(true);
            await systemFeedbackApi.submit(data);
            toast.success("Gửi phản hồi thành công!");
            form.reset();
            onOpenChange(false);
        } catch (error) {
            toast.error("Không thể gửi phản hồi. Vui lòng thử lại.");
            console.error("Failed to submit feedback:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Gửi phản hồi</DialogTitle>
                    <DialogDescription>
                        Giúp chúng tôi cải thiện dịch vụ bằng cách chia sẻ ý kiến của bạn
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Loại phản hồi</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn loại phản hồi" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value={FeedbackType.BUG_REPORT}>Báo lỗi</SelectItem>
                                            <SelectItem value={FeedbackType.FEATURE_REQUEST}>
                                                Yêu cầu tính năng
                                            </SelectItem>
                                            <SelectItem value={FeedbackType.GENERAL}>Phản hồi chung</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="priority"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mức độ ưu tiên</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn mức độ" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value={FeedbackPriority.LOW}>Thấp</SelectItem>
                                            <SelectItem value={FeedbackPriority.MEDIUM}>Trung bình</SelectItem>
                                            <SelectItem value={FeedbackPriority.HIGH}>Cao</SelectItem>
                                            <SelectItem value={FeedbackPriority.CRITICAL}>Khẩn cấp</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tiêu đề</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Nhập tiêu đề ngắn gọn" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mô tả chi tiết</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Mô tả chi tiết vấn đề hoặc ý kiến của bạn..."
                                            className="min-h-[120px] resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isSubmitting}
                            >
                                Hủy
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Đang gửi..." : "Gửi phản hồi"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
