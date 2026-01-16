"use client";

import { useSession } from "next-auth/react";
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
  User,
  Activity,
  ArrowUpRight,
  Compass
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTenantDashboard } from "@/features/tenant/hooks/use-tenant-dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import type { Payment, RoomSummary } from "@/features/tenant/api/dashboard-api";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

function SkeletonItem() {
  return (
    <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-2xl bg-muted/20 animate-pulse overflow-hidden">
      <div className="w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
    </div>
  );
}

export default function TenantDashboardPage() {
  const { data: session } = useSession();
  const name = session?.user?.fullName || session?.user?.name || "bạn";
  const { contractsQuery, paymentsQuery, recommendationsQuery, favoritesQuery, maintenanceQuery, bookingsQuery } = useTenantDashboard();

  const stats = {
    bookings: bookingsQuery.data?.total ?? 0,
    contracts: contractsQuery.data?.total ?? 0,
    payments: paymentsQuery.data?.total ?? 0,
    maintenance: maintenanceQuery.data?.total ?? 0,
  };

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
      className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8"
    >
      {/* Hero Section */}
      <motion.div variants={item} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 glass-card p-10 rounded-[2.5rem] relative overflow-hidden group border-none shadow-2xl shadow-primary/5">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-primary/10 rounded-full blur-[100px] animate-pulse-soft"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-blue-500/5 rounded-full blur-[80px]"></div>

        <div className="space-y-3 relative z-10">
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-none px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
              Verified Account
            </Badge>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <h1 className="text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground to-foreground/50">
            Xin chào, {name.split(' ')[0]}!
          </h1>
          <p className="text-muted-foreground text-lg font-medium max-w-xl leading-relaxed">
            Mọi thông tin về chỗ ở, hợp đồng và thanh toán của bạn đều ở đây.
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
      <BentoGrid className="max-w-7xl mx-auto md:auto-rows-[26rem]">

        {/* Item 1: Upcoming Payments */}
        <motion.div variants={item}>
          <BentoGridItem
            title={<span className="text-xl font-bold">Thanh toán</span>}
            description={
              paymentsQuery.data?.items?.length === 0
                ? "Thanh toán đầy đủ. Chúc bạn ngày mới tốt lành!"
                : `Bạn đang có ${paymentsQuery.data?.items?.length ?? 0} hóa đơn cần xử lý.`
            }
            header={
              paymentsQuery.isLoading ? <SkeletonItem /> : (
                <div className="flex flex-col gap-3 h-full overflow-hidden mt-4">
                  {paymentsQuery.data?.items?.slice(0, 3).map((p: Payment) => (
                    <div key={p.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group/p">
                      <div>
                        <p className="font-bold text-sm">Hóa đơn #{p.id.slice(-4).toUpperCase()}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock3 className="w-3 h-3" /> Due: {p.dueDate}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-primary text-base">{(p.amount || 0).toLocaleString('vi-VN')}đ</p>
                        <Link href="/dashboard/tenant/payments" className="text-[10px] font-bold text-primary flex items-center gap-1 opacity-0 group-hover/p:opacity-100 transition-opacity justify-end">
                          Pay Now <ArrowUpRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                  {paymentsQuery.data?.items?.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-40">
                      <div className="p-4 bg-primary/5 rounded-full mb-4">
                        <CreditCard className="w-10 h-10 text-primary" />
                      </div>
                      <p className="text-sm font-bold uppercase tracking-widest">Không có hóa đơn</p>
                    </div>
                  )}
                </div>
              )
            }
            icon={<CreditCard className="h-5 w-5 text-primary" />}
            className="glass-card border-none hover:shadow-2xl transition-all duration-500"
          />
        </motion.div>

        {/* Item 2: Quick Stats */}
        <motion.div variants={item}>
          <BentoGridItem
            title={<span className="text-xl font-bold">Hoạt động</span>}
            description="Tóm tắt tình hình chỗ ở của bạn."
            header={
              <div className="grid grid-cols-2 gap-3 h-full content-center mt-4">
                {[
                  { label: "Bookings", val: stats.bookings, icon: Home, color: "bg-primary/5 text-primary", border: "border-primary/10" },
                  { label: "Contracts", val: stats.contracts, icon: FileText, color: "bg-orange-500/5 text-orange-500", border: "border-orange-500/10" },
                  { label: "Issues", val: stats.maintenance, icon: AlertCircle, color: "bg-blue-500/5 text-blue-500", border: "border-blue-500/10" },
                  { label: "Utilities", val: "Check", icon: Zap, color: "bg-purple-500/5 text-purple-500", border: "border-purple-500/10" },
                ].map((s, idx) => (
                  <div key={idx} className={cn("flex flex-col items-center justify-center p-4 rounded-3xl border transition-all cursor-default hover:scale-[1.02]", s.color, s.border)}>
                    <s.icon className="w-6 h-6 mb-2" />
                    <span className="text-2xl font-black tracking-tighter">{s.val}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">{s.label}</span>
                  </div>
                ))}
              </div>
            }
            icon={<Activity className="h-5 w-5 text-neutral-500" />}
            className="glass-card border-none hover:shadow-2xl transition-all duration-500"
          />
        </motion.div>

        {/* Item 3: Quick Actions */}
        <motion.div variants={item}>
          <BentoGridItem
            title={<span className="text-xl font-bold">Lối tắt</span>}
            description="Thực hiện nhanh các yêu cầu."
            header={
              <div className="grid grid-cols-1 gap-2 h-full content-start pt-6">
                {[
                  { label: "Hợp đồng thuê", icon: "📂", href: "/dashboard/tenant/contracts" },
                  { label: "Lịch sử thanh toán", icon: "💳", href: "/dashboard/tenant/payments" },
                  { label: "Yêu cầu bảo trì", icon: "🛠️", href: "/dashboard/tenant/maintenance" },
                  { label: "Danh sách yêu thích", icon: "❤️", href: "/dashboard/tenant/favorites" },
                ].map((act, id) => (
                  <Button key={id} variant="outline" className="w-full justify-between h-14 rounded-2xl glass-card border-none hover:bg-white/10 dark:hover:bg-black/20 text-sm font-bold group/act px-5" asChild>
                    <Link href={act.href}>
                      <span className="flex items-center gap-3">
                        <span className="text-xl">{act.icon}</span>
                        {act.label}
                      </span>
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover/act:opacity-100 transition-all translate-x-[-10px] group-hover/act:translate-x-0" />
                    </Link>
                  </Button>
                ))}
              </div>
            }
            icon={<Zap className="h-5 w-5 text-amber-500" />}
            className="glass-card border-none hover:shadow-2xl transition-all duration-500"
          />
        </motion.div>

        {/* Item 4: Recommendations */}
        <motion.div variants={item} className="md:col-span-2">
          <BentoGridItem
            title={<span className="text-xl font-bold">Đề xuất cho bạn</span>}
            description="Tìm phòng phù hợp dựa trên sở thích của bạn"
            header={
              recommendationsQuery.isLoading ? <SkeletonItem /> : (
                <div className="flex gap-4 overflow-x-auto pb-4 h-full items-center mt-4 scrollbar-hide">
                  {recommendationsQuery.data?.items?.length === 0 && <p className="text-sm text-muted-foreground pl-1 italic">Chưa có gợi ý phù hợp.</p>}
                  {recommendationsQuery.data?.items?.map((item: RoomSummary) => (
                    <motion.div
                      key={item.id}
                      whileHover={{ y: -5 }}
                      className="min-w-[240px] p-4 rounded-3xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all cursor-pointer group/card"
                    >
                      <div className="aspect-[4/3] bg-muted/20 rounded-2xl mb-4 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-neutral-200/50 to-neutral-500/50 dark:from-neutral-800 dark:to-neutral-900" />
                        <Badge className="absolute top-2 right-2 bg-primary/20 text-primary border-none backdrop-blur-md rounded-lg text-[9px] font-black tracking-widest uppercase">98% Match</Badge>
                      </div>
                      <p className="font-bold text-base truncate mb-1">{item.name}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-primary font-black text-sm">{(item.pricePerMonth || 0).toLocaleString('vi-VN')}đ</p>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
                          <MapPin className="w-3 h-3" /> Quận 1
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )
            }
            icon={<Sparkles className="h-5 w-5 text-primary" />}
            className="glass-card border-none hover:shadow-2xl transition-all duration-500"
          />
        </motion.div>

        {/* Item 5: Favorites */}
        <motion.div variants={item} className="md:col-span-1">
          <BentoGridItem
            title={<span className="text-xl font-bold">Đã lưu</span>}
            description="Phòng bạn quan tâm"
            header={
              favoritesQuery.isLoading ? <SkeletonItem /> : (
                <div className="space-y-3 h-full overflow-auto pr-1 mt-4 scrollbar-hide">
                  {favoritesQuery.data?.items?.map((room: RoomSummary) => (
                    <div key={room.id} className="flex items-center gap-4 p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 group/f">
                      <div className="w-12 h-12 rounded-xl bg-muted/20 flex-shrink-0 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-blue-500/10" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{room.name}</p>
                        <p className="text-xs font-bold text-primary">{(room.pricePerMonth || 0).toLocaleString('vi-VN')}đ</p>
                      </div>
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-xl bg-white/5 opacity-0 group-hover/f:opacity-100 transition-all" asChild>
                        <Link href={`/rooms/${room.id}`}><ArrowRight className="w-4 h-4" /></Link>
                      </Button>
                    </div>
                  ))}
                  {favoritesQuery.data?.items?.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-30 mt-10">
                      <Heart className="w-10 h-10 mb-2" />
                      <p className="text-xs font-bold uppercase tracking-widest">Chưa lưu phòng nào</p>
                    </div>
                  )}
                </div>
              )
            }
            icon={<Heart className="h-5 w-5 text-primary" />}
            className="glass-card border-none hover:shadow-2xl transition-all duration-500"
          />
        </motion.div>

      </BentoGrid>
    </motion.div>
  );
}
