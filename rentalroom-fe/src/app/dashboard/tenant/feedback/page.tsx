"use client";

import { useState } from "react";
import { Plus, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SystemFeedbackForm } from "@/features/feedback/components/system-feedback-form";
import { useMyFeedback } from "@/features/feedback/hooks/use-system-feedback";
import { FeedbackPriority, FeedbackStatus, FeedbackType, SystemFeedback } from "@/features/feedback/types";
import { Skeleton } from "@/components/ui/skeleton";

export default function TenantFeedbackPage() {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const { data: feedbacks, isLoading } = useMyFeedback();

    const getStatusBadge = (status: FeedbackStatus) => {
        switch (status) {
            case FeedbackStatus.PENDING:
                return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">Đang chờ</Badge>;
            case FeedbackStatus.IN_PROGRESS:
                return <Badge variant="outline" className="bg-info/10 text-info border-info/20">Đang xử lý</Badge>;
            case FeedbackStatus.RESOLVED:
                return <Badge variant="outline" className="bg-success/10 text-success border-success/20">Đã giải quyết</Badge>;
            case FeedbackStatus.REJECTED:
                return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Từ chối</Badge>;
            default:
                return <Badge variant="outline">Mới</Badge>;
        }
    };

    const getPriorityBadge = (priority: FeedbackPriority) => {
        switch (priority) {
            case FeedbackPriority.CRITICAL:
                return <Badge variant="destructive">Khẩn cấp</Badge>;
            case FeedbackPriority.HIGH:
                return <Badge className="bg-warning text-warning-foreground hover:bg-warning/90">Cao</Badge>;
            case FeedbackPriority.MEDIUM:
                return <Badge variant="secondary">Trung bình</Badge>;
            case FeedbackPriority.LOW:
                return <Badge variant="outline">Thấp</Badge>;
            default:
                return null;
        }
    };

    const getTypeLabel = (type: FeedbackType) => {
        switch (type) {
            case FeedbackType.BUG_REPORT:
                return "Báo lỗi";
            case FeedbackType.FEATURE_REQUEST:
                return "Yêu cầu tính năng";
            case FeedbackType.GENERAL:
                return "Phản hồi chung";
            default:
                return type;
        }
    };

    return (
        <div className="container py-8 max-w-5xl space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Phản hồi & Hỗ trợ</h1>
                    <p className="text-muted-foreground mt-2">
                        Gửi đóng góp ý kiến hoặc báo lỗi để chúng tôi phục vụ bạn tốt hơn
                    </p>
                </div>
                <Button onClick={() => setIsFormOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Gửi phản hồi mới
                </Button>
            </div>

            <div className="space-y-6">
                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-32 w-full rounded-xl" />
                        ))}
                    </div>
                ) : !feedbacks || feedbacks.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center p-12 text-center space-y-4">
                            <div className="p-4 rounded-full bg-muted/50">
                                <MessageSquare className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold">Bạn chưa gửi phản hồi nào</h3>
                                <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">
                                    Nếu bạn gặp vấn đề hoặc có ý kiến đóng góp, hãy cho chúng tôi biết.
                                </p>
                            </div>
                            <Button variant="outline" onClick={() => setIsFormOpen(true)}>
                                Gửi phản hồi ngay
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {feedbacks.map((feedback: SystemFeedback) => (
                            <Card key={feedback.id} className="overflow-hidden">
                                <CardHeader className="bg-muted/30 pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary" className="font-normal">
                                                    {getTypeLabel(feedback.type)}
                                                </Badge>
                                                {getPriorityBadge(feedback.priority)}
                                                <span className="text-xs text-muted-foreground ml-2">
                                                    {new Date(feedback.createdAt).toLocaleDateString('vi-VN')}
                                                </span>
                                            </div>
                                            <CardTitle className="text-lg font-semibold">
                                                {feedback.title}
                                            </CardTitle>
                                        </div>
                                        {getStatusBadge(feedback.status)}
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-4 space-y-4">
                                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                        {feedback.description}
                                    </p>

                                    {feedback.adminResponse && (
                                        <div className="mt-4 bg-info/5 p-4 rounded-lg border border-info/10">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Badge variant="secondary" className="bg-info/10 text-info hover:bg-info/20 border-none">
                                                    Phản hồi từ Admin
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    {feedback.respondedAt && new Date(feedback.respondedAt).toLocaleDateString('vi-VN')}
                                                </span>
                                            </div>
                                            <p className="text-sm text-foreground">
                                                {feedback.adminResponse}
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <SystemFeedbackForm open={isFormOpen} onOpenChange={setIsFormOpen} />
        </div>
    );
}
