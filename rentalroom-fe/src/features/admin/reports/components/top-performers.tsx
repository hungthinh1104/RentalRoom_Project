import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type TopLandlord, type TopProperty } from "../types";

interface TopPerformersProps {
	landlords: TopLandlord[];
	properties: TopProperty[];
}

export function TopPerformers({ landlords, properties }: TopPerformersProps) {
	return (
		<div className="grid gap-4 lg:grid-cols-2">
			<Card className="border-muted/70">
				<CardHeader>
					<CardTitle>Top chủ nhà</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					{landlords.map((item) => (
						<div key={item.landlordId} className="flex items-center justify-between rounded-lg border border-muted/60 p-3">
							<div>
								<p className="font-medium">{item.name}</p>
								<p className="text-sm text-muted-foreground">{item.properties} BĐS • {item.occupancyRate.toFixed(1)}% lấp đầy</p>
							</div>
							<div className="text-right">
								<p className="font-semibold">{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(item.revenue)}</p>
								<Badge variant="secondary" className="mt-1">HĐ cao</Badge>
							</div>
						</div>
					))}
				</CardContent>
			</Card>

			<Card className="border-muted/70">
				<CardHeader>
					<CardTitle>Top tài sản</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					{properties.map((item) => (
						<div key={item.propertyId} className="flex items-center justify-between rounded-lg border border-muted/60 p-3">
							<div>
								<p className="font-medium">{item.name}</p>
								<p className="text-sm text-muted-foreground">{item.landlord}</p>
							</div>
							<div className="text-right">
								<p className="font-semibold">{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(item.revenue)}</p>
								<p className="text-sm text-muted-foreground">{item.occupancyRate.toFixed(1)}% lấp đầy</p>
							</div>
						</div>
					))}
				</CardContent>
			</Card>
		</div>
	);
}
