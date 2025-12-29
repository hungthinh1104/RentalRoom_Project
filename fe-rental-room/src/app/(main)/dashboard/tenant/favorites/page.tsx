"use client";

import Link from "next/link";
import { Heart, MapPin, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTenantDashboard } from "@/features/tenant/hooks/use-tenant-dashboard";
import type { RoomSummary } from "@/features/tenant/api/dashboard-api";

export default function TenantFavoritesPage() {
	const { favoritesQuery } = useTenantDashboard();
	const items = favoritesQuery.data?.items ?? [];

	return (
		<div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-6">
			<div className="flex flex-col gap-3">
				<h1 className="text-3xl font-bold text-foreground">Phòng yêu thích</h1>
				<p className="text-muted-foreground text-sm">Lưu lại các phòng bạn thích và quay lại đặt phòng bất cứ lúc nào.</p>
			</div>

			<Card className="border border-border bg-card/80 backdrop-blur-xl rounded-[28px] shadow-xl shadow-muted/30">
				<CardHeader className="pb-0 flex items-center justify-between">
					<CardTitle className="flex items-center gap-2 text-lg font-semibold">
						<Heart className="h-5 w-5 text-primary" />
						Danh sách yêu thích
					</CardTitle>
					<Badge variant="secondary" className="text-xs">Đồng bộ đa thiết bị</Badge>
				</CardHeader>
				<CardContent className="pt-4 space-y-4">
					{favoritesQuery.isLoading && (
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{[...Array(4)].map((_, idx) => (
								<Skeleton key={idx} className="h-32 w-full rounded-2xl" />
							))}
						</div>
					)}

					{!favoritesQuery.isLoading && items.length === 0 && (
						<div className="rounded-2xl border border-dashed border-border/80 p-8 text-center space-y-4">
							<div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
								<Heart className="h-6 w-6 text-muted-foreground" />
							</div>
							<div className="space-y-2">
								<p className="font-semibold">Bạn chưa lưu phòng nào</p>
								<p className="text-sm text-muted-foreground">Khám phá danh sách phòng và nhấn biểu tượng trái tim để lưu.</p>
							</div>
							<div className="flex items-center justify-center gap-3">
								<Button asChild className="gap-2">
									<Link href="/rooms">
										<Sparkles className="h-4 w-4" />
										Khám phá phòng
									</Link>
								</Button>
							</div>
						</div>
					)}

					{!favoritesQuery.isLoading && items.length > 0 && (
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{items.map((room: RoomSummary) => (
								<div key={room.id} className="rounded-2xl border border-border/80 bg-muted/40 p-4 flex flex-col gap-3">
									<div className="flex items-center justify-between gap-3">
										<div className="space-y-1">
											<p className="font-semibold text-base">{room.name ?? "Phòng"}</p>
											<div className="flex items-center gap-2 text-sm text-muted-foreground">
												<MapPin className="h-4 w-4" />
												{room.city ?? ""} {room.ward ? `- ${room.ward}` : ""}
											</div>
										</div>
										{room.pricePerMonth && (
											<Badge variant="outline" className="text-primary border-primary/30">
												{room.pricePerMonth.toLocaleString("vi-VN")}đ / tháng
											</Badge>
										)}
									</div>
									<div className="flex justify-end">
										<Button asChild size="sm" variant="outline" className="gap-2">
											<Link href={`/rooms/${room.id}`}>
												Xem phòng
											</Link>
										</Button>
									</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
