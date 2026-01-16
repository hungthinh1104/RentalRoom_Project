"use client";

import { useSession } from "next-auth/react";
import { Star, Calendar, Home, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api/client";
import { useQuery } from "@tanstack/react-query";
import type { RoomReview } from "@/features/feedback/api/reviews-api";

export default function TenantReviewsPage() {
    const { data: session } = useSession();
    const tenantId = session?.user?.id;

    const { data: reviews, isLoading } = useQuery({
        queryKey: ['tenant-reviews', tenantId],
        queryFn: async () => {
            const { data } = await api.get(`/rooms/reviews/tenant/${tenantId}`);
            return data as RoomReview[];
        },
        enabled: !!tenantId,
    });

    if (isLoading) {
        return (
            <div className="container py-8 max-w-5xl space-y-6">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="container py-8 max-w-5xl space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Đánh giá của tôi</h1>
                <p className="text-muted-foreground mt-2">
                    Xem lại các đánh giá bạn đã gửi và phản hồi từ chủ nhà.
                </p>
            </div>

            <div className="grid gap-6">
                {!reviews || reviews.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center p-12 text-center space-y-4">
                            <div className="p-4 rounded-full bg-muted/50">
                                <MessageSquare className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold">Chưa có đánh giá nào</h3>
                                <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">
                                    Sau khi hợp đồng kết thúc, bạn có thể đánh giá phòng để giúp người khác đưa ra quyết định tốt hơn.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    reviews.map((review: RoomReview) => (
                        <Card key={review.id} className="overflow-hidden">
                            <CardHeader className="bg-muted/30">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <Home className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">
                                                {review.room?.property?.name || "Tên nhà"}
                                            </CardTitle>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Phòng {review.room?.roomNumber || "N/A"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                        <Calendar className="h-4 w-4" />
                                        {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="p-6 space-y-4">
                                {/* Rating Stars */}
                                <div className="flex items-center gap-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">
                                            Đánh giá tổng thể
                                        </p>
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    className={`h-5 w-5 ${star <= review.rating
                                                        ? "fill-yellow-400 text-yellow-400"
                                                        : "text-gray-300"
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Detailed Ratings */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Độ sạch sẽ</p>
                                        <div className="flex gap-0.5">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    className={`h-3 w-3 ${star <= review.cleanlinessRating
                                                        ? "fill-yellow-400 text-yellow-400"
                                                        : "text-gray-300"
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Vị trí</p>
                                        <div className="flex gap-0.5">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    className={`h-3 w-3 ${star <= review.locationRating
                                                        ? "fill-yellow-400 text-yellow-400"
                                                        : "text-gray-300"
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Giá trị</p>
                                        <div className="flex gap-0.5">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    className={`h-3 w-3 ${star <= review.valueRating
                                                        ? "fill-yellow-400 text-yellow-400"
                                                        : "text-gray-300"
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Comment */}
                                {review.comment && (
                                    <div className="pt-2">
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {review.comment}
                                        </p>
                                    </div>
                                )}

                                {/* Landlord Reply */}
                                {review.landlordReply && (
                                    <div className="mt-4 pt-4 border-t bg-muted/30 p-4 rounded-lg">
                                        <div className="flex items-start gap-2">
                                            <Badge variant="secondary" className="mt-0.5">
                                                Phản hồi từ chủ nhà
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                                            {review.landlordReply}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            {new Date(review.repliedAt || "").toLocaleDateString("vi-VN")}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
