import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type PlatformMetricsDto } from "../types";

interface TrendsTableProps {
	trends: PlatformMetricsDto[];
}

export function TrendsTable({ trends }: TrendsTableProps) {
	return (
		<Card className="border-muted/70">
			<CardHeader>
				<CardTitle>Xu hướng người dùng</CardTitle>
			</CardHeader>
			<CardContent className="p-0">
				<div className="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Chu kỳ</TableHead>
								<TableHead>Người dùng</TableHead>
								<TableHead>Chủ nhà mới</TableHead>
								<TableHead>Người thuê mới</TableHead>
								<TableHead>HĐ hoạt động</TableHead>
								<TableHead>Doanh thu</TableHead>
								<TableHead>Lấp đầy</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{trends.map((row) => (
								<TableRow key={row.period}>
									<TableCell className="font-medium">{row.period}</TableCell>
									<TableCell>{row.totalUsers.toLocaleString("vi-VN")}</TableCell>
									<TableCell>{row.newLandlords.toLocaleString("vi-VN")}</TableCell>
									<TableCell>{row.newTenants.toLocaleString("vi-VN")}</TableCell>
									<TableCell>{row.activeContracts.toLocaleString("vi-VN")}</TableCell>
									<TableCell>
										{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(row.totalRevenue)}
									</TableCell>
									<TableCell>{row.averageOccupancy.toFixed(1)}%</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			</CardContent>
		</Card>
	);
}
