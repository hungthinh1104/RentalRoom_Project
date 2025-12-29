import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { type AdminOverview } from "../schemas";

interface SummaryCardsProps {
	summary: AdminOverview["summary"];
}

const formatCurrency = (value: number) =>
	new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);

export function SummaryCards({ summary }: SummaryCardsProps) {
	const items = [
		{ label: "Người dùng", value: summary.totalUsers },
		{ label: "Chủ nhà", value: summary.totalLandlords },
		{ label: "Người thuê", value: summary.totalTenants },
		{ label: "BĐS", value: summary.totalProperties },
		{ label: "Phòng", value: summary.totalRooms },
		{ label: "Hợp đồng", value: summary.activeContracts },
	];

	return (
		<div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
			{items.map((item) => (
				<Card key={item.label} className="border-muted/70">
					<CardHeader className="pb-2">
						<CardTitle className="text-sm text-muted-foreground">{item.label}</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-semibold">{item.value.toLocaleString("vi-VN")}</p>
					</CardContent>
				</Card>
			))}

			<Card className="md:col-span-2 lg:col-span-2 border-primary/40">
				<CardHeader className="pb-2">
					<CardTitle className="text-sm text-primary">Doanh thu nền tảng</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2">
					<p className="text-2xl font-semibold text-primary">{formatCurrency(summary.platformRevenue)}</p>
					<Separator />
					<p className="text-sm text-muted-foreground">
						Tỉ lệ lấp đầy trung bình: {summary.averageOccupancy.toFixed(1)}%
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
