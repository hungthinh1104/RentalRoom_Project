'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Search, Filter } from 'lucide-react';

export default function LandlordReviewsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRating, setFilterRating] = useState<string>('all');

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

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Tìm kiếm theo phòng, nội dung đánh giá..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={filterRating} onValueChange={setFilterRating}>
                            <SelectTrigger className="w-full sm:w-[200px]">
                                <Filter className="w-4 h-4 mr-2" />
                                <SelectValue placeholder="Lọc theo rating" />
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
                    </div>
                </CardContent>
            </Card>

            {/* Empty State */}
            <Card>
                <CardContent className="py-12">
                    <div className="flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                            <MessageSquare className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Chưa có đánh giá nào</h3>
                        <p className="text-sm text-muted-foreground max-w-md">
                            Khi khách thuê đánh giá phòng của bạn, chúng sẽ hiển thị ở đây.
                            Bạn có thể phản hồi và quản lý tất cả đánh giá tại trang này.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
