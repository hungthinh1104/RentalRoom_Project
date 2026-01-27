"use client";

import React, { memo, useCallback, useMemo } from "react";
import { TrendingUp, Users, Building2, DollarSign, Activity, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";

const ResponsiveContainer = dynamic(() => import('recharts').then((m) => m.ResponsiveContainer), { ssr: false, loading: () => <Skeleton className="w-full h-full rounded-xl" /> });
const AreaChart = dynamic(() => import('recharts').then((m) => m.AreaChart), { ssr: false });
const Area = dynamic(() => import('recharts').then((m) => m.Area), { ssr: false });
const XAxis = dynamic(() => import('recharts').then((m) => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then((m) => m.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then((m) => m.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then((m) => m.Tooltip), { ssr: false });
const PieChart = dynamic(() => import('recharts').then((m) => m.PieChart), { ssr: false });
const Pie = dynamic(() => import('recharts').then((m) => m.Pie), { ssr: false });
const Cell = dynamic(() => import('recharts').then((m) => m.Cell), { ssr: false });

interface TopLandlord {
  landlordId: string;
  name: string;
  properties: number;
  revenue: number;
  occupancyRate: number;
}

interface TopProperty {
  propertyId?: string;
  id?: string;
  name: string;
  landlord?: string;
  revenue: number;
  occupiedRooms?: number;
  rooms?: number;
  occupancyRate: number;
}

interface Trend { date: string; revenue: number }
interface KpiCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  palette: 'primary' | 'success' | 'warning' | 'info';
  isLoading: boolean;
  delay: number;
}

export interface AdminDashboardClientProps {
  stats: {
    totalRevenue: number;
    occupancyRate: number;
    expiringContracts: number;
    activeUsers: number;
    totalRooms: number;
    totalProperties: number;
    trends: Trend[];
    topPerformers?: { landlords: TopLandlord[]; properties: TopProperty[] };
  };
}

export default function AdminDashboardClient({ stats }: AdminDashboardClientProps) {
  const isLoading = false;
  const error = null;

  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }),
    [],
  );

  const formatCurrency = useCallback(
    (value: number | undefined) => {
      if (value === undefined) return "₫ 0";
      if (value >= 1_000_000_000) return `₫ ${(value / 1_000_000_000).toFixed(1)}B`;
      if (value >= 1_000_000) return `₫ ${(value / 1_000_000).toFixed(1)}M`;
      return currencyFormatter.format(value);
    },
    [currencyFormatter],
  );

  const formatDateShort = useCallback((val: string) => {
    const date = new Date(val);
    return Number.isNaN(date.getTime())
      ? ""
      : date.toLocaleDateString("vi-VN", { month: "numeric", day: "numeric" });
  }, []);

  const chartData = useMemo(() => stats?.trends ?? [], [stats]);
  const topLandlords = useMemo(() => stats?.topPerformers?.landlords ?? [], [stats]);
  const topProperties = useMemo(() => stats?.topPerformers?.properties ?? [], [stats]);

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

  const totalRevenue = stats?.totalRevenue || 0;
  const occupancyRate = stats?.occupancyRate || 0;
  const activeUsers = stats?.activeUsers || 0;
  const expiringContracts = stats?.expiringContracts || 0;

  if (error) {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-4 text-center">
        <div className="p-4 rounded-full bg-destructive/10 text-destructive">
          <Activity className="h-12 w-12" />
        </div>
        <h2 className="text-2xl font-bold">Không thể tải dữ liệu</h2>
        <p className="text-muted-foreground max-w-md">
          Có lỗi xảy ra khi kết nối với máy chủ. Vui lòng thử lại sau.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="min-h-screen space-y-8 p-6 md:p-10 max-w-[1600px] mx-auto"
    >
      {/* Header Section */}
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest border border-primary/20">
              Admin Portal
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              System Online
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
            Tổng quan <span className="text-primary">Hệ thống</span>
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Chào mừng trở lại! Đây là báo cáo hiệu suất mới nhất hôm nay.
          </p>
        </div>
      </motion.div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="Doanh thu tháng"
          value={formatCurrency(totalRevenue)}
          icon={<DollarSign className="w-6 h-6 text-white" />}
          palette="primary"
          isLoading={isLoading}
          delay={0}
        />
        <KpiCard
          title="Tỷ lệ lấp đầy"
          value={`${occupancyRate}%`}
          icon={<Building2 className="w-6 h-6 text-white" />}
          palette="success"
          isLoading={isLoading}
          delay={0.1}
        />
        <KpiCard
          title="Người dùng Active"
          value={activeUsers.toLocaleString()}
          icon={<Users className="w-6 h-6 text-white" />}
          palette="info"
          isLoading={isLoading}
          delay={0.2}
        />
        <KpiCard
          title="Sắp hết hạn"
          value={expiringContracts.toString()}
          icon={<ShieldCheck className="w-6 h-6 text-white" />}
          palette="warning"
          isLoading={isLoading}
          delay={0.3}
        />
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
        {/* Revenue Chart */}
        <motion.div variants={item} className="lg:col-span-2 group relative overflow-hidden rounded-3xl border bg-card/50 p-8 shadow-sm backdrop-blur-xl transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Biểu đồ Doanh thu
              </h3>
              <p className="text-sm text-muted-foreground">Xu hướng 6 tháng gần nhất</p>
            </div>
          </div>

          <div className="h-[350px] w-full">
            {isLoading ? <Skeleton className="w-full h-full rounded-xl" /> : (
              <ResponsiveContainer width="100%" height="100%" minHeight={350}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.3} />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                    tickFormatter={(val) => formatDateShort(String(val))}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                    tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`}
                    dx={-10}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--popover)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                    itemStyle={{ color: 'var(--foreground)' }}
                    formatter={(val: unknown) => (typeof val === "number" ? currencyFormatter.format(val) : "₫ 0")}
                    labelFormatter={(val: unknown) => formatDateShort(String(val))}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--primary)"
                    strokeWidth={3}
                    fill="url(#colorRevenue)"
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Occupancy Donut */}
        <motion.div variants={item} className="lg:col-span-1 rounded-3xl border bg-card/50 p-8 shadow-sm backdrop-blur-xl transition-all hover:shadow-md flex flex-col">
          <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-success" />
            Trạng thái phòng
          </h3>
          <div className="flex-1 flex items-center justify-center relative min-h-[300px]">
            {isLoading ? <Skeleton className="w-48 h-48 rounded-full" /> : (
              <>
                <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Đã thuê', value: occupancyRate },
                        { name: 'Trống', value: 100 - occupancyRate }
                      ]}
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      <Cell fill="var(--primary)" />
                      <Cell fill="var(--muted)" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-5xl font-black text-foreground">{occupancyRate}%</span>
                  <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Lấp đầy</span>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>

      {/* Top Performers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Top Landlords */}
        <motion.div variants={item} className="rounded-3xl border bg-card/50 p-8 shadow-sm backdrop-blur-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">Chủ nhà tiêu biểu</h3>
            <button className="text-xs font-semibold text-primary hover:underline">Xem tất cả</button>
          </div>
          <div className="space-y-4">
            {isLoading ? Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />) :
              topLandlords.map((l: TopLandlord, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-2xl hover:bg-muted/50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-bold">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-sm group-hover:text-primary transition-colors">{l.name}</p>
                      <p className="text-xs text-muted-foreground">{l.properties} BĐS</p>
                    </div>
                  </div>
                  <span className="font-bold text-sm text-foreground">{formatCurrency(l.revenue)}</span>
                </div>
              ))
            }
          </div>
        </motion.div>

        {/* Top Properties */}
        <motion.div variants={item} className="rounded-3xl border bg-card/50 p-8 shadow-sm backdrop-blur-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">BĐS Doanh thu cao</h3>
            <button className="text-xs font-semibold text-info hover:underline">Xem tất cả</button>
          </div>
          <div className="space-y-4">
            {isLoading ? Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />) :
              topProperties.map((p: TopProperty, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-2xl hover:bg-muted/50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                      style={{
                        backgroundImage: `linear-gradient(to bottom right, color-mix(in oklab, var(--info) 20%, transparent), color-mix(in oklab, var(--info) 5%, transparent))`,
                        color: 'var(--info)'
                      }}
                    >
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-sm group-hover:text-info transition-colors truncate max-w-[150px]">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.rooms} phòng</p>
                    </div>
                  </div>
                  <span className="font-bold text-sm text-foreground">{formatCurrency(p.revenue)}</span>
                </div>
              ))
            }
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

const KpiCard = memo(function KpiCard({ title, value, icon, palette, isLoading, delay }: KpiCardProps) {
  const colorVar = palette === 'primary'
    ? '--primary'
    : palette === 'success'
      ? '--success'
      : palette === 'warning'
        ? '--warning'
        : '--info';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="relative overflow-hidden rounded-[2rem] p-6 bg-card border shadow-sm hover:shadow-xl transition-all duration-300 group"
    >
      <div
        className="absolute top-0 right-0 w-32 h-32 opacity-10 rounded-bl-[4rem] transition-all group-hover:scale-110"
        style={{
          backgroundImage: `linear-gradient(to bottom right, var(${colorVar}), color-mix(in oklab, var(${colorVar}) 65%, transparent))`
        }}
      />

      <div className="relative z-10">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg mb-4 group-hover:scale-105 transition-transform"
          style={{
            backgroundImage: `linear-gradient(to bottom right, var(${colorVar}), color-mix(in oklab, var(${colorVar}) 65%, transparent))`,
            color: 'var(--primary-foreground)'
          }}
        >
          {icon}
        </div>

        <h3 className="text-muted-foreground text-sm font-medium uppercase tracking-wider mb-1">{title}</h3>
        {isLoading ? <Skeleton className="h-10 w-32" /> :
          <div className="text-3xl font-black tracking-tight text-foreground">
            {value}
          </div>
        }
      </div>
    </motion.div>
  );
});
