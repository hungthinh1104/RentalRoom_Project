import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchLandlordRatings, fetchAdminMarketInsights } from "@/features/admin/api";
import { Star } from "lucide-react";
import { Suspense } from "react";
import { TableSkeleton } from "@/components/skeletons/dashboard-skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MarketInsightsClient } from "./market-insights-client";

export const dynamic = 'force-dynamic';

async function MarketInsights() {
  const insights = await fetchAdminMarketInsights();

  if (!insights) {
    return null;
  }

  return <MarketInsightsClient insights={insights} />;
}

async function RatingsList() {
  const { data: ratings } = await fetchLandlordRatings();

  if (ratings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Đánh giá chủ nhà</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Không có dữ liệu đánh giá</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Đánh giá chủ nhà</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Chủ nhà</TableHead>
              <TableHead className="text-center">Đánh giá</TableHead>
              <TableHead className="text-right">Số lượng</TableHead>
              <TableHead className="text-right">Bình luận</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ratings.map((rating) => (
              <TableRow key={rating.id}>
                <TableCell className="font-medium">{rating.landlordName}</TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span>{rating.averageRating.toFixed(1)}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="outline">{rating.totalRatings}</Badge>
                </TableCell>
                <TableCell className="text-right">{rating.reviewCount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-8">
      <div className="border-b border-border/40 pb-4">
        <h1 className="text-3xl font-bold text-primary">
          Thống kê & Đánh giá
        </h1>
        <p className="text-muted-foreground mt-1">Phân tích thị trường và đánh giá chất lượng</p>
      </div>

      <Suspense fallback={<TableSkeleton rows={6} />}>
        <MarketInsights />
      </Suspense>

      <Suspense fallback={<TableSkeleton rows={6} />}>
        <RatingsList />
      </Suspense>
    </div>
  );
}
