"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { reportsApi, LandlordDashboardSummary, CashFlowSummary, CashFlowAlert } from "@/lib/api/reportsApi";
import { useLandlordDashboard, useCashFlow } from "@/features/reports/hooks/use-dashboard";
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
  LayoutDashboard,
  Sparkles,
  ArrowRight,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  TrendingDown
} from "lucide-react";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

function Vnd({ value }: { value: number }) {
  const text = useMemo(
    () => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value),
    [value],
  );
  return <span>{text}</span>;
}

export default function LandlordOverviewPage() {
  const { data: session } = useSession();
  const landlordId = session?.user?.id;
  const name = session?.user?.fullName || session?.user?.name || "Bạn";

  const { data: summary, isLoading: isLoadingSummary, error: summaryError } = useLandlordDashboard(landlordId);
  const { data: cashFlow, isLoading: isLoadingCashFlow, error: cashFlowError } = useCashFlow();

  const loading = isLoadingSummary || isLoadingCashFlow;
  const error = summaryError?.message || cashFlowError?.message || null;

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

  // Transform data for charts
  const revenueData = summary?.revenueLast6Months.map((d: { year: number; month: number; amount: number }, i: number) => ({
    name: `T${i + 1}`, // Simplified label
    amount: d.amount
  })) || [];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-8 max-w-[1600px] mx-auto p-6 md:p-10"
    >
      {/* Hero Section */}
      <motion.div variants={item} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 glass-card p-10 rounded-[2.5rem] relative overflow-hidden group border-none shadow-2xl shadow-primary/5">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-primary/10 rounded-full blur-[100px] animate-pulse-soft group-hover:bg-primary/20 transition-all duration-700"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-info/5 rounded-full blur-[80px] group-hover:bg-info/10 transition-all duration-700"></div>

        <div className="space-y-3 relative z-10 w-full max-w-2xl">
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="flex items-center gap-2">
            <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-none px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
              Landlord Portal
            </Badge>
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground to-foreground/50">
            Xin chào, {name.split(' ').pop()}!
          </h1>
          <div className="text-muted-foreground text-lg font-medium leading-relaxed">
            {loading ? <Skeleton className="h-6 w-3/4 rounded-lg" /> :
              <p>
                Bạn đang quản lý <span className="text-foreground font-bold">{summary?.summary.totalProperties || 0} bất động sản</span> với tỷ lệ lấp đầy <span className="text-primary font-bold">{summary?.summary.occupancyRate.toFixed(0)}%</span>.
              </p>
            }
          </div>
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

      {/* Financial Health Alerts */}
      {!loading && cashFlow?.alerts && cashFlow.alerts.length > 0 && (
        <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cashFlow.alerts.map((alert: CashFlowAlert, idx: number) => (
            <Alert
              key={idx}
              className={cn(
                "border-l-4 shadow-sm",
                alert.type === 'overdue' ? "border-l-destructive bg-destructive/5" :
                  alert.type === 'forecast' ? "border-l-warning bg-warning/5" :
                    alert.type === 'upcoming' ? "border-l-info bg-info/5" :
                      "border-l-success bg-success/5"
              )}
            >
              {alert.type === 'overdue' ? <AlertCircle className="h-4 w-4 text-destructive" /> :
                alert.type === 'forecast' ? <TrendingDown className="h-4 w-4 text-warning" /> :
                  alert.type === 'upcoming' ? <AlertTriangle className="h-4 w-4 text-info" /> :
                    <CheckCircle2 className="h-4 w-4 text-success" />}
              <AlertDescription className="flex items-center justify-between w-full">
                <span className="font-medium text-sm">{alert.message}</span>
                {alert.amount && (
                  <Badge variant="outline" className="ml-2 bg-background/50 whitespace-nowrap">
                    <Vnd value={alert.amount} />
                  </Badge>
                )}
              </AlertDescription>
            </Alert>
          ))}
        </motion.div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Revenue Chart Card */}
        <motion.div variants={item} className="md:col-span-2 rounded-[2rem] border bg-card/50 p-8 shadow-sm backdrop-blur-xl relative overflow-hidden group">
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Banknote className="w-5 h-5 text-success" />
                Doanh thu
              </h3>
              <p className="text-sm text-muted-foreground">6 tháng gần nhất</p>
            </div>
            {loading ? <Skeleton className="h-10 w-32" /> :
              <div className="text-right">
                <div className="text-3xl font-black text-foreground">
                  <Vnd value={summary?.summary.revenueThisMonth || 0} />
                </div>
                <Badge variant="outline" className="bg-success/10 text-success border-none">Tháng này</Badge>
              </div>
            }
          </div>

          <div className="h-[300px] w-full mt-4">
            {loading ? <Skeleton className="w-full h-full rounded-xl" /> : (
              <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--success)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--success)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.3} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--popover)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                    formatter={(val: number | undefined) => val !== undefined ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val) : '₫ 0'}
                  />
                  <Area type="monotone" dataKey="amount" stroke="var(--success)" strokeWidth={3} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Occupancy Card */}
        <motion.div variants={item} className="md:col-span-1 rounded-[2rem] border bg-card/50 p-8 shadow-sm backdrop-blur-xl flex flex-col items-center justify-center relative overflow-hidden">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2 w-full">
            <Activity className="w-5 h-5 text-info" />
            Tỷ lệ lấp đầy
          </h3>
          <div className="w-full flex-1 flex flex-col items-center justify-center">
            {loading ? <Skeleton className="w-48 h-48 rounded-full" /> : (
              <div className="relative w-[200px] h-[200px]">
                <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Đã thuê', value: summary?.summary.occupancyRate || 0 },
                        { name: 'Trống', value: 100 - (summary?.summary.occupancyRate || 0) }
                      ]}
                      innerRadius={70}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      <Cell fill="var(--primary)" />
                      <Cell fill="var(--muted)" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-4xl font-black text-foreground">{(summary?.summary.occupancyRate || 0).toFixed(0)}%</span>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Lấp đầy</span>
                </div>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4 w-full mt-6">
            <div className="text-center p-3 rounded-2xl bg-primary/5 hover:bg-primary/10 transition-colors">
              <p className="text-2xl font-bold text-primary">{summary?.summary.occupiedRooms || 0}</p>
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Đã thuê</p>
            </div>
            <div className="text-center p-3 rounded-2xl bg-muted/20 hover:bg-muted/30 transition-colors">
              <p className="text-2xl font-bold text-foreground">{summary?.summary.availableRooms || 0}</p>
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Trống</p>
            </div>
          </div>
        </motion.div>

        {/* Action Items */}
        <motion.div variants={item} className="md:col-span-1 rounded-[2rem] border bg-card/50 p-6 shadow-sm backdrop-blur-xl">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <FileWarning className="w-5 h-5 text-warning" />
            Cần xử lý
          </h3>
          <div className="space-y-3">
            <Link href="/dashboard/landlord/finance" className="flex items-center justify-between p-4 rounded-2xl bg-warning/5 text-warning-foreground hover:bg-warning/10 transition-all border border-transparent hover:border-warning/20">
              <span className="font-semibold text-sm">Hóa đơn quá hạn</span>
              <Badge className="bg-warning text-warning-foreground hover:bg-warning/90 border-none">{summary?.summary.overdueInvoices || 0}</Badge>
            </Link>
            <Link href="/dashboard/landlord/maintenance" className="flex items-center justify-between p-4 rounded-2xl bg-info/5 text-info-foreground hover:bg-info/10 transition-all border border-transparent hover:border-info/20">
              <span className="font-semibold text-sm">Yêu cầu bảo trì</span>
              <Badge className="bg-info text-info-foreground hover:bg-info/90 border-none">{summary?.summary.openMaintenance || 0}</Badge>
            </Link>
          </div>
        </motion.div>

        {/* Shortcuts */}
        <motion.div variants={item} className="md:col-span-2 rounded-[2rem] border bg-card/50 p-6 shadow-sm backdrop-blur-xl">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-accent-purple" />
            Truy cập nhanh
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { href: "/dashboard/landlord/contracts", icon: FileWarning, label: "Hợp đồng", color: "text-primary" },
              { href: "/dashboard/landlord/tenants", icon: Users, label: "Khách thuê", color: "text-info" },
              { href: "/dashboard/landlord/finance", icon: Banknote, label: "Thu chi", color: "text-success" },
              { href: "/dashboard/landlord/maintenance", icon: Wrench, label: "Bảo trì", color: "text-warning" },
            ].map((s, idx) => (
              <Link key={idx} href={s.href} className="flex flex-col items-center justify-center p-4 rounded-2xl bg-background/50 border hover:border-primary/50 hover:bg-primary/5 transition-all group">
                <s.icon className={cn("w-6 h-6 mb-2 transition-transform group-hover:scale-110", s.color)} />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground group-hover:text-foreground">{s.label}</span>
              </Link>
            ))}
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}
