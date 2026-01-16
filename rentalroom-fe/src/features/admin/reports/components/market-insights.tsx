import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { type AdminMarketInsights } from "../schemas";

interface MarketInsightsProps {
	insights: AdminMarketInsights;
	error?: string | null;
}

export function MarketInsights({ insights, error }: MarketInsightsProps) {
	return (
		<div className="grid gap-4 lg:grid-cols-2">
			{error && (
				<div className="lg:col-span-2 p-4 rounded-md bg-destructive/10 border border-destructive/20 text-destructive">
					<strong>Không thể tải phân tích thị trường:</strong> {error}
				</div>
			)}

			<Card className="border-muted/70">
				<CardHeader>
					<CardTitle>Phân tích giá</CardTitle>
				</CardHeader>
				<CardContent className="p-0">
					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Loại</TableHead>
									<TableHead>Khu vực</TableHead>
									<TableHead>Giá TB</TableHead>
									<TableHead>Niêm yết</TableHead>
									<TableHead>Lấp đầy</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{insights.priceAnalysis.map((item, idx) => (
									<TableRow key={`${item.propertyType}-${idx}`}>
										<TableCell className="font-medium">{item.propertyType}</TableCell>
										<TableCell>{item.city} - {item.ward}</TableCell>
										<TableCell>
											{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(item.averagePrice)}
										</TableCell>
										<TableCell>{item.totalListings.toLocaleString("vi-VN")}</TableCell>
										<TableCell>{item.occupancyRate.toFixed(1)}%</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				</CardContent>
			</Card>

			<Card className="border-muted/70">
				<CardHeader>
					<CardTitle>Nhu cầu & đề xuất</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<div className="rounded-lg border border-muted/60 p-3">
						<p className="text-sm text-muted-foreground">Tìm kiếm / Ứng tuyển / Tỷ lệ chuyển đổi</p>
						<p className="text-xl font-semibold">
							{insights.demandMetrics.totalSearches.toLocaleString("vi-VN")} / {insights.demandMetrics.totalApplications.toLocaleString("vi-VN")} / {insights.demandMetrics.conversionRate.toFixed(1)}%
						</p>
						<p className="text-sm text-muted-foreground">Thời gian đặt phòng TB: {insights.demandMetrics.averageTimeToBook.toFixed(1)} ngày</p>
					</div>

					<div className="space-y-2">
						<p className="text-sm font-semibold">Tìm kiếm phổ biến</p>
						<div className="flex flex-wrap gap-2">
							{insights.popularSearches.map((search) => (
								<Badge key={search.query} variant="secondary" className="text-sm">
									{search.query} ({search.searchCount})
								</Badge>
							))}
						</div>
					</div>

					<div className="space-y-2">
						<p className="text-sm font-semibold">Khuyến nghị</p>
						<ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
							{insights.recommendations.map((item, idx) => (
								<li key={`${item}-${idx}`}>{item}</li>
							))}
						</ul>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
