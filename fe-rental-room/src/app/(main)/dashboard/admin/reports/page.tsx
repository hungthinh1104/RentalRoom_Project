import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAdminOverview, getAdminMarketInsights } from "@/features/admin/reports/api";
import { SummaryCards } from "@/features/admin/reports/components/summary-cards";
import { TrendsTable } from "@/features/admin/reports/components/trends-table";
import { TopPerformers } from "@/features/admin/reports/components/top-performers";
import { MarketInsights } from "@/features/admin/reports/components/market-insights";
import { Button } from "@/components/ui/button";
import { Calendar, Download } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
	const session = await getServerSession(authOptions);
	if (!session || session.user?.role !== "ADMIN") {
		return redirect("/dashboard");
	}

	let overview;
	let insights;
	let insightsError: string | null = null;

	try {
		[overview, insights] = await Promise.all([
			getAdminOverview({ period: "monthly", periods: 6 }),
			getAdminMarketInsights(),
		]);
	} catch (err) {
		// If market insights fail, still show overview and a friendly note for admins
		console.error('[Admin] Market insights failed:', err);
		insightsError = err instanceof Error ? err.message : String(err);
		// Try to at least fetch overview
		overview = await getAdminOverview({ period: "monthly", periods: 6 });
		insights = {
			priceAnalysis: [],
			popularSearches: [],
			demandMetrics: { totalSearches: 0, totalApplications: 0, conversionRate: 0, averageTimeToBook: 0 },
			recommendations: [],
		};
	}

	return (
		<div className="space-y-8">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-4">
				<div>
					<h1 className="text-3xl font-bold bg-gradient-to-r from-rose-600 to-pink-500 bg-clip-text text-transparent">
						Báo cáo & Phân tích
					</h1>
					<p className="text-muted-foreground mt-1">Tổng quan nền tảng, xu hướng và khuyến nghị</p>
				</div>
				<div className="flex items-center gap-2">
					<Button variant="outline" className="h-9">
						<Calendar className="mr-2 h-4 w-4" />
						6 tháng qua
					</Button>
					<Button className="h-9 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white border-0">
						<Download className="mr-2 h-4 w-4" />
						Xuất báo cáo
					</Button>
				</div>
			</div>

			<SummaryCards summary={overview.summary} />

			<TrendsTable trends={overview.trends} />

			<TopPerformers landlords={overview.topPerformers.landlords} properties={overview.topPerformers.properties} />

			<MarketInsights insights={insights} error={insightsError} />
		</div>
	);
}
