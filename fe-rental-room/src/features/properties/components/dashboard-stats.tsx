"use client";

import { motion } from "framer-motion";
import { Building2, DoorOpen, Users, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Property } from "@/types";
import { RoomStatus } from "@/types/enums";
import { useMemo } from "react";

interface DashboardStatsProps {
    properties: Property[];
}

export function DashboardStats({ properties }: DashboardStatsProps) {
    const stats = useMemo(() => {
        const totalProperties = properties.length;
        let totalRooms = 0;
        let occupiedRooms = 0;
        let totalRevenue = 0;

        properties.forEach((p) => {
            const rooms = p.rooms || [];
            totalRooms += p.totalRooms || rooms.length;
            rooms.forEach((r) => {
                if (r.status === RoomStatus.OCCUPIED) {
                    occupiedRooms++;
                    totalRevenue += Number(r.pricePerMonth || 0);
                }
            });
        });

        const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

        return [
            {
                label: "Tổng Bất Động Sản",
                value: totalProperties,
                icon: Building2,
                color: "text-blue-600 dark:text-blue-400",
                bgColor: "bg-blue-500/10 dark:bg-blue-500/20",
            },
            {
                label: "Tổng Số Phòng",
                value: totalRooms,
                icon: DoorOpen,
                color: "text-purple-600 dark:text-purple-400",
                bgColor: "bg-purple-500/10 dark:bg-purple-500/20",
            },
            {
                label: "Tỷ Lệ Lấp Đầy",
                value: `${occupancyRate}%`,
                icon: Users,
                color: "text-emerald-600 dark:text-emerald-400",
                bgColor: "bg-emerald-500/10 dark:bg-emerald-500/20",
                subtext: `${occupiedRooms}/${totalRooms} phòng đã thuê`,
            },
            {
                label: "Doanh Thu Ước Tính",
                value: new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                    maximumFractionDigits: 0,
                }).format(totalRevenue),
                icon: TrendingUp,
                color: "text-orange-600 dark:text-orange-400",
                bgColor: "bg-orange-500/10 dark:bg-orange-500/20",
                subtext: "Dựa trên các phòng đã thuê",
            },
        ];
    }, [properties]);

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    const item = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 },
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
            {stats.map((stat, idx) => (
                <motion.div key={idx} variants={item}>
                    <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                                    <p className="text-2xl font-bold">{stat.value}</p>
                                    {stat.subtext && (
                                        <p className="text-xs text-muted-foreground">{stat.subtext}</p>
                                    )}
                                </div>
                                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            ))}
        </motion.div>
    );
}
