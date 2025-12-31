'use client';

import { useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, Search, Filter, Star } from 'lucide-react';
import { LandlordReviewCard } from '@/features/feedback/components/landlord-review-card';
import { useLandlordReviews } from '@/features/feedback/hooks/use-reviews';
import type { RoomReview } from '@/features/feedback/api/reviews-api';

export default function LandlordReviewsPage() {
    const { data: session } = useSession();
    const landlordId = session?.user?.id;
    const { data: reviewsData, isLoading } = useLandlordReviews(landlordId);

    const [searchQuery, setSearchQuery] = useState('');
    const [filterRating, setFilterRating] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');

    const filteredReviews = useMemo(() => {
        if (!reviewsData?.data) return [];

        return reviewsData.data.filter((review: RoomReview) => {
            // Search filter
            const matchesSearch =
                searchQuery === '' ||
                review.room?.roomNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                review.room?.property?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                review.comment?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                review.tenant?.user?.fullName?.toLowerCase().includes(searchQuery.toLowerCase());

            // Rating filter
            const avgRating = Math.round(
                (review.rating + review.cleanlinessRating + review.locationRating + review.valueRating) / 4
            );
            const matchesRating = filterRating === 'all' || avgRating === parseInt(filterRating);

            // Status filter (replied or not)
            const matchesStatus =
                filterStatus === 'all' ||
                (filterStatus === 'replied' && review.landlordReply) ||
                (filterStatus === 'pending' && !review.landlordReply);

            return matchesSearch && matchesRating && matchesStatus;
        });
    }, [reviewsData?.data, searchQuery, filterRating, filterStatus]);

    const stats = useMemo(() => {
        if (!reviewsData?.data || reviewsData.data.length === 0) {
            return { total: 0, avgRating: 0, pending: 0 };
        }
        const reviews = reviewsData.data;
        const avgRating =
            reviews.reduce(
                (sum: number, r: RoomReview) => sum + (r.rating + r.cleanlinessRating + r.locationRating + r.valueRating) / 4,
                0
            ) / reviews.length;
        const pending = reviews.filter((r: RoomReview) => !r.landlordReply).length;
        return { total: reviews.length, avgRating, pending };
    }, [reviewsData?.data]);

    return (
        <div className="container py-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Đánh giá & Phản hồi</h1>
                    <p className="text-muted-foreground mt-1">
                        Quản lý đánh giá từ khách thuê và phản hồi của bạn
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            {!isLoading && reviewsData?.data && reviewsData.data.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <MessageSquare className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stats.total}</p>
                                    <p className="text-sm text-muted-foreground">Tổng đánh giá</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-yellow-500/10">
                                    <Star className="w-5 h-5 text-yellow-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stats.avgRating.toFixed(1)}</p>
                                    <p className="text-sm text-muted-foreground">Điểm trung bình</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-orange-500/10">
                                    <MessageSquare className="w-5 h-5 text-orange-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stats.pending}</p>
                                    <p className="text-sm text-muted-foreground">Chờ phản hồi</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Tìm kiếm theo phòng, tên khách thuê, nội dung..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={filterRating} onValueChange={setFilterRating}>
                            <SelectTrigger className="w-full sm:w-[150px]">
                                <Star className="w-4 h-4 mr-2" />
                                <SelectValue placeholder="Rating" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả rating</SelectItem>
                                <SelectItem value="5">5 sao</SelectItem>
                                <SelectItem value="4">4 sao</SelectItem>
                                <SelectItem value="3">3 sao</SelectItem>
                                <SelectItem value="2">2 sao</SelectItem>
                                <SelectItem value="1">1 sao</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <Filter className="w-4 h-4 mr-2" />
                                <SelectValue placeholder="Trạng thái" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                                <SelectItem value="pending">Chờ phản hồi</SelectItem>
                                <SelectItem value="replied">Đã phản hồi</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Loading State */}
            {isLoading && (
                <div className="grid gap-4 md:grid-cols-2">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-64" />
                    ))}
                </div>
            )}

            {/* Reviews List */}
            {!isLoading && filteredReviews.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2">
                    {filteredReviews.map((review: RoomReview) => (
                        <LandlordReviewCard key={review.id} review={review} />
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!isLoading && filteredReviews.length === 0 && (
                <Card>
                    <CardContent className="py-12">
                        <div className="flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                <MessageSquare className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">
                                {reviewsData?.data && reviewsData.data.length > 0
                                    ? 'Không tìm thấy đánh giá'
                                    : 'Chưa có đánh giá nào'}
                            </h3>
                            <p className="text-sm text-muted-foreground max-w-md">
                                {reviewsData?.data && reviewsData.data.length > 0
                                    ? 'Thử thay đổi bộ lọc để tìm đánh giá khác.'
                                    : 'Khi khách thuê đánh giá phòng của bạn, chúng sẽ hiển thị ở đây. Bạn có thể phản hồi và quản lý tất cả đánh giá tại trang này.'}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
