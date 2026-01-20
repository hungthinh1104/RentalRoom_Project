"use client";

import { useRecommendations } from "../hooks/use-recommendations";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Info } from "lucide-react";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils";
import { RecommendedRoom } from "../types";

export function RecommendationList() {
    const { data: rooms, isLoading } = useRecommendations();

    if (isLoading) {
        return <RecommendationSkeleton />;
    }

    if (!rooms || rooms.length === 0) {
        return (
            <Card className="bg-muted/50 border-dashed">
                <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                    <div className="p-3 bg-background rounded-full mb-3">
                        <Info className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground font-medium">Hiện chưa có gợi ý phòng phù hợp cho bạn.</p>
                    <p className="text-xs text-muted-foreground mt-1">Hãy thử thêm một vài phòng vào danh sách yêu thích để chúng tôi hiểu gu của bạn hơn nhé!</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {rooms.slice(0, 2).map((room: RecommendedRoom) => (
                <RecommendationCard key={room.id} room={room} />
            ))}
        </div>
    );
}

function RecommendationCard({ room }: { room: RecommendedRoom }) {
    const mainImage = room.images?.[0]?.url || '/placeholder-room.jpg';

    return (
        <div className="flex gap-4 p-4 rounded-3xl bg-background/40 hover:bg-background/60 transition-all border border-white/5 cursor-pointer group/card">
            <div className="w-24 h-24 bg-muted/20 rounded-2xl flex-shrink-0 relative overflow-hidden">
                <Image
                    src={mainImage}
                    alt={`Phòng ${room.roomNumber}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <p className="font-bold text-sm truncate mb-1 group-hover/card:text-primary transition-colors">Phòng {room.roomNumber} - {room.property.name}</p>
                <p className="text-primary font-black text-lg">{formatCurrency(room.pricePerMonth)}/th</p>
                <div className="flex items-center gap-2 mt-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    <MapPin className="w-3 h-3" /> {room.property.city}
                </div>
            </div>
        </div>
    );
}

function RecommendationSkeleton() {
    return (
        <div className="space-y-4">
            <div className="h-7 w-40 bg-muted/50 rounded-md animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
                        <div className="h-48 bg-muted animate-pulse" />
                        <div className="p-4 space-y-3">
                            <div className="h-5 w-2/3 bg-muted animate-pulse rounded" />
                            <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
