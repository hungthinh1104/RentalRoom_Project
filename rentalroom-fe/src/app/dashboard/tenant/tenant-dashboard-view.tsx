"use client";

import Link from "next/link";
import {
    Zap,
    Home,
    FileText,
    CreditCard,
    AlertCircle,
    Heart,
    Sparkles,
    ShieldCheck,
    MapPin,
    Clock3,
    ArrowRight,
    ArrowUpRight,
    Compass,
    TrendingUp,
    Calendar,
    Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import type { Payment, RoomSummary, Contract } from "@/features/tenant/api/dashboard-api";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import type { FavoriteRoom } from "@/lib/api/favorites-api";

interface TenantDashboardViewProps {
    user: {
        name: string;
        id?: string;
    };
    data: {
        contracts: { items: Contract[]; total: number };
        payments: { items: Payment[]; total: number };
        recommendations: { items: RoomSummary[]; total: number };
        favorites: { items: FavoriteRoom[]; total: number };
        maintenance: { items: any[]; total: number };
        bookings: { items: any[]; total: number };
    };
}

export function TenantDashboardView({ user, data }: TenantDashboardViewProps) {
    const { contracts, payments, recommendations, favorites, maintenance, bookings } = data;

    const stats = {
        bookings: bookings.total,
        contracts: contracts.total,
        payments: payments.total,
        maintenance: maintenance.total,
    };

    // Transform data for charts
    const paymentHistoryData = payments.items.slice(0, 6).reverse().map((p: Payment) => ({
        name: p.dueDate ? new Date(p.dueDate).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }) : 'N/A',
        amount: p.amount
    }));

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 py-8 space-y-8"
        >
            {/* Hero Section */}
            <motion.div variants={item} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 glass-card p-10 rounded-[2.5rem] relative overflow-hidden group border-none shadow-2xl shadow-primary/5">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-primary/10 rounded-full blur-[100px] animate-pulse-soft"></div>
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-blue-500/5 rounded-full blur-[80px]"></div>

                <div className="space-y-3 relative z-10 w-full max-w-2xl">
                    <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-none px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                            Verified Tenant
                        </Badge>
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground to-foreground/50">
                        Xin chào, {user.name.split(' ').pop()}!
                    </h1>
                    <p className="text-muted-foreground text-lg font-medium leading-relaxed">
                        Chào mừng trở lại. Bạn có <span className="text-primary font-bold">{payments.items.filter((p: Payment) => p.status === 'PENDING').length || 0} hóa đơn</span> cần thanh toán.
                    </p>
                </div>
                <Button asChild size="lg" className="relative z-10 h-14 px-8 rounded-2xl shadow-2xl shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 hover:scale-105 active:scale-95 bg-primary hover:bg-primary/90">
                    <Link href="/rooms" className="flex items-center gap-2 font-bold">
                        <Compass className="w-5 h-5" />
                        Khám phá phòng mới
                    </Link>
                </Button>
            </motion.div>

            {/* Bento Grid Layout */}
            <BentoGrid className="max-w-none md:auto-rows-[26rem]">

                {/* Item 1: Payment Chart (New Feature) */}
                <motion.div variants={item} className="md:col-span-2 rounded-[2rem] border bg-card/50 p-8 shadow-sm backdrop-blur-xl relative overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-primary" />
                                Lịch sử chi tiêu
                            </h3>
                            <p className="text-sm text-muted-foreground">Các khoản thanh toán gần đây</p>
                        </div>
                    </div>

                    <div className="h-[300px] w-full">
                        {paymentHistoryData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={paymentHistoryData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.3} />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                                        tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'var(--muted)', opacity: 0.1 }}
                                        contentStyle={{
                                            backgroundColor: 'var(--popover)',
                                            border: '1px solid var(--border)',
                                            borderRadius: '12px',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                        }}
                                        formatter={(val: number | undefined) => val !== undefined ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val) : '₫ 0'}
                                    />
                                    <Bar dataKey="amount" radius={[4, 4, 0, 0]} maxBarSize={50}>
                                        {paymentHistoryData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill="var(--primary)" fillOpacity={0.8} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-40">
                                <CreditCard className="w-12 h-12 mb-2" />
                                <p className="font-bold">Chưa có dữ liệu thanh toán</p>
                            </div>
                        )
                        }
                    </div>
                </motion.div>

                {/* Item 2: Quick Stats */}
                <motion.div variants={item} className="md:col-span-1 rounded-[2rem] border bg-card/50 p-8 shadow-sm backdrop-blur-xl">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-500" />
                        Hoạt động
                    </h3>
                    <div className="grid grid-cols-2 gap-4 h-full content-start">
                        {[
                            { label: "Hợp đồng", val: stats.contracts, icon: FileText, color: "bg-orange-500/10 text-orange-500" },
                            { label: "Yêu cầu", val: stats.maintenance, icon: AlertCircle, color: "bg-blue-500/10 text-blue-500" },
                            { label: "Đã lưu", val: favorites.total, icon: Heart, color: "bg-pink-500/10 text-pink-500" },
                            { label: "Xem phòng", val: stats.bookings, icon: Calendar, color: "bg-purple-500/10 text-purple-500" },
                        ].map((s, idx) => (
                            <div key={idx} className={cn("flex flex-col items-center justify-center p-4 rounded-3xl bg-background/50 border hover:bg-background transition-all cursor-default group")}>
                                <div className={cn("p-3 rounded-2xl mb-2 transition-transform group-hover:scale-110", s.color)}>
                                    <s.icon className="w-5 h-5" />
                                </div>
                                <span className="text-2xl font-black tracking-tighter">{s.val}</span>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{s.label}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Item 3: Upcoming Payments List */}
                <motion.div variants={item} className="md:col-span-1">
                    <BentoGridItem
                        title={<span className="text-xl font-bold">Hóa đơn tới hạn</span>}
                        description="Đừng quên thanh toán đúng hạn nhé."
                        header={
                            <div className="flex flex-col gap-3 h-full overflow-hidden mt-4">
                                {payments.items.slice(0, 3).map((p: Payment) => (
                                    <div key={p.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group/p">
                                        <div>
                                            <p className="font-bold text-sm">#{p.id.slice(-4).toUpperCase()}</p>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1 flex items-center gap-1">
                                                <Clock3 className="w-3 h-3" /> {p.dueDate}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-primary text-base">{(p.amount || 0).toLocaleString('vi-VN')}đ</p>
                                            <Link href="/dashboard/tenant/payments" className="text-[10px] font-bold text-primary flex items-center gap-1 opacity-0 group-hover/p:opacity-100 transition-opacity justify-end">
                                                Pay <ArrowUpRight className="w-3 h-3" />
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                                {payments.items.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-40">
                                        <div className="p-4 bg-emerald-500/10 rounded-full mb-4">
                                            <ShieldCheck className="w-8 h-8 text-emerald-500" />
                                        </div>
                                        <p className="text-sm font-bold uppercase tracking-widest">Đã thanh toán hết</p>
                                    </div>
                                )}
                            </div>
                        }
                        icon={<CreditCard className="h-5 w-5 text-primary" />}
                        className="glass-card border-none hover:shadow-2xl transition-all duration-500"
                    />
                </motion.div>

                {/* Item 4: Recommendations (Improved Cards) */}
                <motion.div variants={item} className="md:col-span-2">
                    <BentoGridItem
                        title={<span className="text-xl font-bold">Gợi ý cho bạn</span>}
                        description="Dựa trên tìm kiếm gần đây"
                        header={
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                                {recommendations.items.slice(0, 2).map((item: RoomSummary) => (
                                    <div
                                        key={item.id}
                                        className="flex gap-4 p-4 rounded-3xl bg-background/40 hover:bg-background/60 transition-all border border-white/5 cursor-pointer group/card"
                                    >
                                        <div className="w-24 h-24 bg-muted/20 rounded-2xl flex-shrink-0 relative overflow-hidden">
                                            {/* Placeholder for image */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-800 dark:to-neutral-900" />
                                            <Home className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-muted-foreground w-8 h-8 opacity-50" />
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                            <p className="font-bold text-sm truncate mb-1 group-hover/card:text-primary transition-colors">{item.name}</p>
                                            <p className="text-primary font-black text-lg">{(item.pricePerMonth || 0).toLocaleString('vi-VN')}đ</p>
                                            <div className="flex items-center gap-2 mt-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                                <MapPin className="w-3 h-3" /> {item.district || 'N/A'} • {item.roomType || 'N/A'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {recommendations.items.length === 0 && <p className="text-sm text-muted-foreground pl-1 italic">Chưa có gợi ý phù hợp.</p>}
                            </div>
                        }
                        icon={<Sparkles className="h-5 w-5 text-purple-500" />}
                        className="glass-card border-none hover:shadow-2xl transition-all duration-500"
                    />
                </motion.div>

            </BentoGrid>
        </motion.div>
    );
}
