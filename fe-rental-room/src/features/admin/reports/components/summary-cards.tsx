import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type AdminOverview } from "../schemas";
import { Users, Home, Key, Building2, Wallet, TrendingUp, FileText } from "lucide-react";

interface SummaryCardsProps {
	summary: AdminOverview["summary"];
}

const formatCurrency = (value: number) =>
	new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);

export function SummaryCards({ summary }: SummaryCardsProps) {
	const items = [
		{ label: "Người dùng", value: summary.totalUsers, icon: Users, color: "text-blue-500" },
		{ label: "Chủ nhà", value: summary.totalLandlords, icon: Home, color: "text-indigo-500" },
		{ label: "Người thuê", value: summary.totalTenants, icon: Key, color: "text-green-500" },
		{ label: "BĐS", value: summary.totalProperties, icon: Building2, color: "text-orange-500" },
		{ label: "Phòng", value: summary.totalRooms, icon: Home, color: "text-purple-500" },
		{ label: "Hợp đồng", value: summary.activeContracts, icon: FileText, color: "text-cyan-500" },
	];

	return (
		<div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
			{items.map((item, i) => (
				<Card key={item.label} className="border-muted/50 hover:border-pink-500/50 transition-colors duration-300">
					<CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
						<CardTitle className="text-sm font-medium text-muted-foreground">{item.label}</CardTitle>
						<item.icon className={`h-4 w-4 ${item.color}`} />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{item.value.toLocaleString("vi-VN")}</div>
					</CardContent>
				</Card>
			))}

			<Card className="md:col-span-3 lg:col-span-3 border-primary/20 relative overflow-hidden">
				<div className="absolute top-0 right-0 p-4 opacity-5">
					<Wallet className="h-24 w-24 text-primary" />
				</div>
				<CardHeader className="pb-2 relative z-10">
					<CardTitle className="text-sm font-medium text-muted-foreground">Doanh thu nền tảng</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4 relative z-10">
					<div className="flex items-baseline gap-2">
						<span className="text-4xl font-bold text-primary">{formatCurrency(summary.platformRevenue)}</span>
					</div>
					<div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 w-fit px-3 py-1 rounded-full">
						<TrendingUp className="h-4 w-4" />
						<span>Tỉ lệ lấp đầy: {summary.averageOccupancy.toFixed(1)}%</span>
					</div>
				</CardContent>
			</Card>

			<Card className="md:col-span-3 lg:col-span-3 border-primary/20 relative overflow-hidden">
				<div className="absolute top-0 right-0 p-4 opacity-5">
					<Users className="h-24 w-24 text-primary" />
				</div>
				<CardHeader className="pb-2 relative z-10">
					<CardTitle className="text-sm font-medium text-muted-foreground">Tăng trưởng người dùng</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4 relative z-10">
					<div className="flex items-baseline gap-2">
						<span className="text-4xl font-bold text-primary">+{summary.totalUsers > 0 ? ((summary.totalTenants / summary.totalUsers) * 10).toFixed(1) : 0}%</span>
					</div>
					<div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 w-fit px-3 py-1 rounded-full">
						<Users className="h-4 w-4" />
						<span>{summary.totalTenants} người thuê mới tháng này</span>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
