"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { Search, TrendingUp, FileText, Clock, AlertTriangle } from "lucide-react";
import { type AdminMarketInsights } from "@/features/admin/api";

interface MarketInsightsClientProps {
    insights: AdminMarketInsights;
}

export function MarketInsightsClient({ insights }: MarketInsightsClientProps) {
    const formatCurrency = (value: number) => {
        if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
        return `${value.toLocaleString()}`;
    };

    return (
        <div className="space-y-6">
            {/* Demand Metrics */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Lượt tìm kiếm</CardTitle>
                        <Search className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{insights.demandMetrics.totalSearches}</div>
                        <p className="text-xs text-muted-foreground">Tổng lượt tìm kiếm</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Đơn thuê</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{insights.demandMetrics.totalApplications}</div>
                        <p className="text-xs text-muted-foreground">Tổng đơn đăng ký</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tỷ lệ chuyển đổi</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{insights.demandMetrics.conversionRate.toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground">Tìm kiếm thành đơn</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Thời gian chốt đơn</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{insights.demandMetrics.averageTimeToBook.toFixed(1)} ngày</div>
                        <p className="text-xs text-muted-foreground">Trung bình</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 h-full">
                {/* Price Analysis Chart */}
                <Card className="flex flex-col h-full">
                    <CardHeader>
                        <CardTitle>Phân tích giá trung bình</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-[300px]">
                        <div className="h-full w-full min-h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={insights.priceAnalysis}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis
                                        dataKey="propertyType"
                                        fontSize={12}
                                        tickFormatter={(val) => val.length > 10 ? `${val.substring(0, 10)}...` : val}
                                    />
                                    <YAxis
                                        fontSize={12}
                                        tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`}
                                    />
                                    <Tooltip
                                        formatter={(val: any) => [`${formatCurrency(Number(val))}`, "Giá TB"]}
                                        labelStyle={{ color: 'black' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Bar dataKey="averagePrice" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Popular Searches & Recommendations */}
                <div className="space-y-6">
                    <Card className="h-fit">
                        <CardHeader>
                            <CardTitle>Tìm kiếm phổ biến</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {insights.popularSearches.length > 0 ? (
                                    insights.popularSearches.map((search, i) => (
                                        <Badge key={i} variant="secondary" className="px-3 py-1">
                                            {search.query} ({search.searchCount})
                                        </Badge>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">Chưa có dữ liệu tìm kiếm</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {insights.recommendations.length > 0 && (
                        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-900">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                                    <AlertTriangle className="h-5 w-5" />
                                    Khuyến nghị hệ thống
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="list-disc pl-5 space-y-1 text-sm text-yellow-800 dark:text-yellow-200">
                                    {insights.recommendations.map((rec, i) => (
                                        <li key={i}>{rec}</li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
