"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { reportsApi, LandlordDashboardSummary } from "@/lib/api/reportsApi";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  DoorOpen,
  Activity,
  Banknote,
  Wrench,
  FileWarning,
  TrendingUp,
  Plus,
  Users,
  ShieldCheck,
  LayoutDashboard,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

function Vnd({ value }: { value: number }) {
  const text = useMemo(
    () => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value),
    [value],
  );
  return <span>{text}</span>;
}

function SparkBars({ data }: { data: Array<{ amount: number }> }) {
  const max = Math.max(1, ...data.map((d) => d.amount));
  return (
    <div className="flex items-end gap-2 h-24 w-full pt-4">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col justify-end group relative">
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${(d.amount / max) * 100}%` }}
            transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
            className="w-full bg-primary/20 rounded-t-lg group-hover:bg-primary/40 transition-all duration-300 relative"
          >
            <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[10px] px-2 py-1 rounded-md shadow-md border border-border/50 whitespace-nowrap z-10 pointer-events-none transition-opacity font-bold">
              {(d.amount / 1000000).toFixed(1)}M
            </div>
          </motion.div>
        </div>
      ))}
    </div>
  );
}

export default function LandlordOverviewPage() {
  const { data: session } = useSession();
  const landlordId = session?.user?.id;
  const name = session?.user?.fullName || session?.user?.name || "Bạn";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<LandlordDashboardSummary | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!landlordId) return;
      setLoading(true);
      setError(null);
      try {
        const data = await reportsApi.getLandlordSummary(landlordId);
        if (mounted) setSummary(data);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        if (mounted) setError(msg || "Có lỗi xảy ra");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [landlordId]);

  const SkeletonItem = () => (
    <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-2xl bg-muted/20 animate-pulse overflow-hidden">
      <div className="w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
    </div>
  );

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

  if (!landlordId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Alert className="max-w-md glass-card">
          <AlertDescription className="text-center font-medium">Vui lòng đăng nhập để xem tổng quan.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-8"
    >
      {/* Hero Section */}
      <motion.div variants={item} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 glass-card p-10 rounded-[2.5rem] relative overflow-hidden group border-none shadow-2xl shadow-primary/5">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-primary/10 rounded-full blur-[100px] animate-pulse-soft group-hover:bg-primary/20 transition-all duration-700"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-blue-500/5 rounded-full blur-[80px] group-hover:bg-blue-500/10 transition-all duration-700"></div>

        <div className="space-y-3 relative z-10">
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="flex items-center gap-2">
            <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-none px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
              Professional Landlord
            </Badge>
            <div className="flex -space-x-1">
              {[1, 2, 3].map(i => <div key={i} className="w-5 h-5 rounded-full border-2 border-background bg-muted overflow-hidden" />)}
            </div>
            <span className="text-xs text-muted-foreground font-medium">+15 properties managed</span>
          </motion.div>
          <h1 className="text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground to-foreground/50">
            Xin chào, {name.split(' ').pop()}!
          </h1>
          <p className="text-muted-foreground text-lg font-medium max-w-xl leading-relaxed">
            Bạn đang có <span className="text-foreground font-bold">{summary?.summary.totalProperties || 0} bất động sản</span> hoạt động với tỷ lệ lấp đầy <span className="text-primary font-bold">{summary?.summary.occupancyRate.toFixed(0)}%</span>.
          </p>
        </div>

        <div className="flex flex-wrap gap-4 relative z-10">
          <Button asChild variant="outline" className="h-12 px-6 rounded-2xl glass-card border-none hover:bg-white/10 dark:hover:bg-black/20 text-foreground transition-all">
            <Link href="/dashboard/landlord/properties" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Tài sản
            </Link>
          </Button>
          <Button asChild className="h-12 px-8 rounded-2xl shadow-2xl shadow-primary/20 hover:shadow-primary/40 transition-all hover:scale-105 active:scale-95 bg-primary hover:bg-primary/90">
            <Link href="/dashboard/landlord/properties/new" className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Thêm mới
            </Link>
          </Button>
        </div>
      </motion.div>

      {error && (
        <motion.div variants={item}>
          <Alert variant="destructive" className="glass-card border-destructive/20 text-destructive bg-destructive/5 rounded-2xl">
            <AlertDescription className="font-medium">{error}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      <BentoGrid className="md:auto-rows-[24rem]">

        {/* Item 1: Revenue & Growth (Wide) */}
        <motion.div variants={item} className="md:col-span-2">
          <BentoGridItem
            title={
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold">Tài chính & Thu nhập</span>
                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none rounded-full px-2 py-0 text-[10px]">
                  <TrendingUp className="w-3 h-3 mr-1" /> +12%
                </Badge>
              </div>
            }
            description="Lịch sử doanh thu 6 tháng gần nhất"
            header={
              loading || !summary ? <SkeletonItem /> : (
                <div className="flex flex-col h-full justify-between pt-4">
                  <div className="bg-white/5 dark:bg-black/10 p-6 rounded-3xl border border-white/5">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Dòng tiền tháng này</p>
                    <div className="text-5xl font-black text-primary tracking-tighter">
                      <Vnd value={summary.summary.revenueThisMonth} />
                    </div>
                  </div>
                  <div className="w-full px-2">
                    <SparkBars data={summary.revenueLast6Months} />
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-4 opacity-50">
                      <span>6 months ago</span>
                      <span>Now</span>
                    </div>
                  </div>
                </div>
              )
            }
            icon={<Banknote className="h-5 w-5 text-emerald-500" />}
            className="glass-card border-none hover:shadow-2xl transition-all duration-500"
          />
        </motion.div>

        {/* Item 2: Occupancy Rate */}
        <motion.div variants={item} className="md:col-span-1">
          <BentoGridItem
            title={<span className="text-xl font-bold">Tỷ lệ lấp đầy</span>}
            description="Tình trạng sử dụng phòng hiện tại"
            header={
              loading || !summary ? <SkeletonItem /> : (
                <div className="flex flex-col items-center justify-center h-full gap-8 py-4">
                  <div className="relative flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                    <svg className="w-40 h-40 transform -rotate-90">
                      <circle cx="80" cy="80" r="72" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-muted/10" />
                      <motion.circle
                        initial={{ strokeDashoffset: 452 }}
                        animate={{ strokeDashoffset: 452 - (452 * summary.summary.occupancyRate) / 100 }}
                        transition={{ duration: 1.5, ease: "circOut" }}
                        cx="80" cy="80" r="72" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={452} className="text-primary"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-4xl font-black tracking-tighter">{summary.summary.occupancyRate.toFixed(0)}%</span>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">Occupied</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 w-full">
                    <div className="bg-emerald-500/5 p-3 rounded-2xl border border-emerald-500/10 text-center">
                      <p className="text-[10px] uppercase font-bold text-emerald-600 mb-1">Đã thuê</p>
                      <p className="text-2xl font-black text-emerald-600">{summary.summary.occupiedRooms}</p>
                    </div>
                    <div className="bg-muted/10 p-3 rounded-2xl border border-border/10 text-center">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Trống</p>
                      <p className="text-2xl font-black text-muted-foreground">{summary.summary.availableRooms}</p>
                    </div>
                  </div>
                </div>
              )
            }
            icon={<Activity className="h-5 w-5 text-blue-500" />}
            className="glass-card border-none hover:shadow-2xl transition-all duration-500"
          />
        </motion.div>

        {/* Item 3: Operational Warnings */}
        <motion.div variants={item} className="md:col-span-1">
          <BentoGridItem
            title={<span className="text-xl font-bold">Vấn đề cần xử lý</span>}
            description="Phản hồi nhanh để đảm bảo trải nghiệm"
            header={
              loading || !summary ? <SkeletonItem /> : (
                <div className="space-y-4 pt-4">
                  <Link href="/dashboard/landlord/finance" className="flex items-center justify-between p-4 rounded-2xl bg-orange-500/5 border border-orange-500/10 text-orange-600 hover:bg-orange-500/10 transition-all group/it">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-orange-500/10 rounded-xl group-hover/it:scale-110 transition-transform">
                        <FileWarning className="w-5 h-5" />
                      </div>
                      <span className="font-bold">Hóa đơn quá hạn</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-black">{summary.summary.overdueInvoices}</span>
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover/it:opacity-100 transition-all translate-x-[-10px] group-hover/it:translate-x-0" />
                    </div>
                  </Link>

                  <Link href="/dashboard/landlord/maintenance" className="flex items-center justify-between p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 text-blue-600 hover:bg-blue-500/10 transition-all group/it">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-500/10 rounded-xl group-hover/it:scale-110 transition-transform">
                        <Wrench className="w-5 h-5" />
                      </div>
                      <span className="font-bold">Yêu cầu bảo trì</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-black">{summary.summary.openMaintenance}</span>
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover/it:opacity-100 transition-all translate-x-[-10px] group-hover/it:translate-x-0" />
                    </div>
                  </Link>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-border/20 text-muted-foreground transition-opacity opacity-60">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-muted/20 rounded-xl">
                        <Users className="w-5 h-5" />
                      </div>
                      <span className="font-bold">Khách sắp hết hạn</span>
                    </div>
                    <span className="text-2xl font-black">0</span>
                  </div>
                </div>
              )
            }
            icon={<FileWarning className="h-5 w-5 text-orange-500" />}
            className="glass-card border-none hover:shadow-2xl transition-all duration-500"
          />
        </motion.div>

        {/* Item 4: Asset Portfolio */}
        <motion.div variants={item} className="md:col-span-1">
          <BentoGridItem
            title={<span className="text-xl font-bold">Danh mục tài sản</span>}
            description="Quy mô đầu tư của bạn"
            header={
              loading || !summary ? <SkeletonItem /> : (
                <div className="grid grid-cols-1 gap-4 h-full content-center pt-2">
                  <div className="flex items-center gap-5 p-5 rounded-3xl bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-all cursor-default">
                    <div className="p-4 bg-white dark:bg-black/40 rounded-2xl shadow-sm">
                      <Building2 className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <p className="text-4xl font-black tracking-tighter text-primary">{summary.summary.totalProperties}</p>
                      <p className="text-xs uppercase font-bold tracking-widest text-muted-foreground">Properties</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-5 p-5 rounded-3xl bg-blue-500/5 border border-blue-500/10 hover:bg-blue-500/10 transition-all cursor-default">
                    <div className="p-4 bg-white dark:bg-black/40 rounded-2xl shadow-sm">
                      <DoorOpen className="w-8 h-8 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-4xl font-black tracking-tighter text-blue-500">{summary.summary.totalRooms}</p>
                      <p className="text-xs uppercase font-bold tracking-widest text-muted-foreground">Total Units</p>
                    </div>
                  </div>
                </div>
              )
            }
            icon={<LayoutDashboard className="h-5 w-5 text-neutral-500" />}
            className="glass-card border-none hover:shadow-2xl transition-all duration-500"
          />
        </motion.div>

        {/* Item 5: Quick Shortcuts */}
        <motion.div variants={item} className="md:col-span-1">
          <BentoGridItem
            title={<span className="text-xl font-bold">Phím tắt</span>}
            description="Thao tác nhanh chóng"
            header={
              <div className="grid grid-cols-2 gap-4 pt-4">
                {[
                  { href: "/dashboard/landlord/contracts", icon: FileWarning, label: "Hợp đồng", color: "text-primary" },
                  { href: "/dashboard/landlord/tenants", icon: Users, label: "Khách thuê", color: "text-blue-500" },
                  { href: "/dashboard/landlord/finance", icon: Banknote, label: "Thu chi", color: "text-emerald-500" },
                  { href: "/dashboard/landlord/maintenance", icon: Wrench, label: "Bảo trì", color: "text-amber-500" },
                ].map((s, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    className="h-auto py-5 flex flex-col items-center gap-3 glass-card border-none hover:bg-primary/5 group/btn transition-all duration-300 rounded-2xl"
                    asChild
                  >
                    <Link href={s.href}>
                      <s.icon className={cn("w-6 h-6 transition-transform group-hover/btn:scale-125", s.color)} />
                      <span className="text-[11px] font-bold uppercase tracking-wider">{s.label}</span>
                    </Link>
                  </Button>
                ))}
              </div>
            }
            icon={<Sparkles className="h-5 w-5 text-amber-500" />}
            className="glass-card border-none hover:shadow-2xl transition-all duration-500"
          />
        </motion.div>

      </BentoGrid>
    </motion.div>
  );
}
