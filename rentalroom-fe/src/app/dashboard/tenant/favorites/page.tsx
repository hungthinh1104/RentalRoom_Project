"use client";

import Link from "next/link";
import { OptimizedImage } from "@/components/common/optimized-image";
import { Heart, MapPin, Sparkles, Maximize, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useFavorites, useFavorite } from "@/features/rooms/hooks/use-favorite";
import { useToast } from "@/hooks/use-toast";

import type { FavoriteRoom } from "@/features/rooms/api/favorites-api";

function FavoriteRoomCard({ room }: { room: FavoriteRoom }) {
	const { toggle } = useFavorite(room.id);
	const { toast } = useToast();

	const handleRemove = async () => {
		try {
			await toggle();
			toast({ title: "Đã bỏ yêu thích" });
		} catch {
			// Error already handled in hook
		}
	};

	return (
		<div className="rounded-2xl border border-border/80 bg-muted/40 p-4 flex gap-4">
			{/* Image */}
			<div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
				<OptimizedImage
					src={room.images?.[0]?.imageUrl || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=200&h=200&fit=crop"}
					alt={`Phòng ${room.roomNumber}`}
					fill
					className="object-cover"
					sizes="96px"
					fallbackSrc="/placeholder-room.jpg"
				/>
			</div>

			{/* Info */}
			<div className="flex-1 flex flex-col justify-between min-w-0">
				<div>
					<p className="font-semibold text-base truncate">Phòng {room.roomNumber}</p>
					<div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
						<MapPin className="h-4 w-4 flex-shrink-0" />
						<span className="truncate">{room.property?.name || "Chưa xác định"}</span>
					</div>
					<div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
						<span className="flex items-center gap-1">
							<Maximize className="h-3 w-3" />
							{room.area} m²
						</span>
						<Badge variant="outline" className="text-primary border-primary/30">
							{room.pricePerMonth?.toLocaleString("vi-VN")}đ / tháng
						</Badge>
					</div>
				</div>

				<div className="flex justify-between items-center mt-3">
					<Button asChild size="sm" variant="default" className="gap-2">
						<Link href={`/rooms/${room.id}`}>
							Xem phòng
						</Link>
					</Button>
					<Button
						size="sm"
						variant="ghost"
						className="text-destructive hover:text-destructive hover:bg-destructive/10"
						onClick={handleRemove}
					>
						<Trash2 className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}

export default function TenantFavoritesPage() {
	const { favorites, loading, refresh } = useFavorites();

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
						{favorites.length > 0 && (
							<Badge variant="secondary" className="ml-2">{favorites.length}</Badge>
						)}
					</CardTitle>
					{favorites.length > 0 && (
						<Button variant="ghost" size="sm" onClick={refresh} className="text-xs">
							Làm mới
						</Button>
					)}
				</CardHeader>
				<CardContent className="pt-4 space-y-4">
					{loading && (
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{[...Array(4)].map((_, idx) => (
								<Skeleton key={idx} className="h-32 w-full rounded-2xl" />
							))}
						</div>
					)}

					{!loading && favorites.length === 0 && (
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

					{!loading && favorites.length > 0 && (
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{favorites.map((room) => (
								<FavoriteRoomCard key={room.id} room={room} />
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
