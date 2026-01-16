'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Star, Home, User, MessageSquare, Send, Check } from 'lucide-react';
import type { RoomReview } from '../api/reviews-api';
import { useReplyToReview } from '../hooks/use-reviews';
import { cn } from '@/lib/utils';

interface LandlordReviewCardProps {
    review: RoomReview;
}

function RatingStars({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
    const sizeClass = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={cn(
                        sizeClass,
                        star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'
                    )}
                />
            ))}
        </div>
    );
}

export function LandlordReviewCard({ review }: LandlordReviewCardProps) {
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [replyText, setReplyText] = useState('');
    const replyMutation = useReplyToReview();

    const handleSubmitReply = async () => {
        if (!replyText.trim()) return;
        await replyMutation.mutateAsync({ reviewId: review.id, reply: replyText });
        setShowReplyForm(false);
        setReplyText('');
    };

    const averageRating = (
        (review.rating + review.cleanlinessRating + review.locationRating + review.valueRating) / 4
    ).toFixed(1);

    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <RatingStars rating={Math.round(Number(averageRating))} size="md" />
                            <span className="text-sm font-semibold">{averageRating}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true, locale: vi })}
                        </p>
                    </div>
                    {review.landlordReply ? (
                        <Badge variant="secondary" className="gap-1">
                            <Check className="w-3 h-3" />
                            Đã phản hồi
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                            Chờ phản hồi
                        </Badge>
                    )}
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Tenant & Room Info */}
                <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span>{review.tenant?.user?.fullName || 'Khách thuê'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Home className="w-4 h-4 text-muted-foreground" />
                        <span>
                            {review.room?.property?.name} - Phòng {review.room?.roomNumber}
                        </span>
                    </div>
                </div>

                {/* Rating Details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="space-y-1">
                        <span className="text-muted-foreground">Tổng thể</span>
                        <div className="flex items-center gap-1">
                            <RatingStars rating={review.rating} />
                            <span className="font-medium">{review.rating}</span>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <span className="text-muted-foreground">Sạch sẽ</span>
                        <div className="flex items-center gap-1">
                            <RatingStars rating={review.cleanlinessRating} />
                            <span className="font-medium">{review.cleanlinessRating}</span>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <span className="text-muted-foreground">Vị trí</span>
                        <div className="flex items-center gap-1">
                            <RatingStars rating={review.locationRating} />
                            <span className="font-medium">{review.locationRating}</span>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <span className="text-muted-foreground">Giá trị</span>
                        <div className="flex items-center gap-1">
                            <RatingStars rating={review.valueRating} />
                            <span className="font-medium">{review.valueRating}</span>
                        </div>
                    </div>
                </div>

                {/* Comment */}
                {review.comment && (
                    <div className="rounded-lg bg-muted/50 p-3">
                        <p className="text-sm">&ldquo;{review.comment}&rdquo;</p>
                    </div>
                )}

                {/* Landlord Reply */}
                {review.landlordReply && (
                    <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 space-y-1">
                        <div className="flex items-center gap-2 text-xs text-primary font-medium">
                            <MessageSquare className="w-3 h-3" />
                            Phản hồi của bạn
                        </div>
                        <p className="text-sm">{review.landlordReply}</p>
                        {review.repliedAt && (
                            <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(review.repliedAt), { addSuffix: true, locale: vi })}
                            </p>
                        )}
                    </div>
                )}

                {/* Reply Form */}
                {!review.landlordReply && (
                    <>
                        {showReplyForm ? (
                            <div className="space-y-3">
                                <Textarea
                                    placeholder="Nhập phản hồi của bạn..."
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    rows={3}
                                />
                                <div className="flex gap-2 justify-end">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setShowReplyForm(false);
                                            setReplyText('');
                                        }}
                                    >
                                        Hủy
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={handleSubmitReply}
                                        disabled={!replyText.trim() || replyMutation.isPending}
                                        className="gap-2"
                                    >
                                        <Send className="w-3 h-3" />
                                        {replyMutation.isPending ? 'Đang gửi...' : 'Gửi phản hồi'}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowReplyForm(true)}
                                className="gap-2"
                            >
                                <MessageSquare className="w-4 h-4" />
                                Phản hồi đánh giá
                            </Button>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}
