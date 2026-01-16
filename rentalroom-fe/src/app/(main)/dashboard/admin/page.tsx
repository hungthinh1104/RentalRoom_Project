"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminDashboardStats } from "@/features/admin/hooks/use-admin-stats";
import {
  TrendingUp,
  Home,
  Clock,
  Users,
  Building2,
  DoorOpen,
  DollarSign,
  Percent,
  Sparkles,
  ArrowUpRight
} from "lucide-react";
import { cn } from "@/lib/utils";
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
import { motion } from "framer-motion";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useAdminDashboardStats();

  const formatCurrency = (value: number) => {
    if (value >= 1_000_000_000) {
      return `₫ ${(value / 1_000_000_000).toFixed(1)}B`;
    }
    if (value >= 1_000_000) {
      return `₫ ${(value / 1_000_000).toFixed(1)}M`;
    }
    return `₫ ${value.toLocaleString()}`;
  };

  const kpiItems = [
    {
      title: "Tổng doanh thu",
      value: formatCurrency(stats?.totalRevenue || 0),
      subtext: "Tháng này",
      icon: <DollarSign className="h-4 w-4" />,
      color: "bg-blue-500/10 text-blue-500",
      className: "md:col-span-1",
    },
    {
      title: "Tỷ lệ lấp đầy",
      value: `${stats?.occupancyRate || 0}%`,
      subtext: "Phòng đang sử dụng",
      icon: <Percent className="h-4 w-4" />,
      color: "bg-emerald-500/10 text-emerald-500",
      className: "md:col-span-1",
    },
    {
      title: "Hợp đồng hoạt động",
      value: stats?.expiringContracts || 0,
      subtext: "Đang có hiệu lực",
      icon: <Clock className="h-4 w-4" />,
      color: "bg-amber-500/10 text-amber-500",
      className: "md:col-span-1",
    },
    {
      title: "Người dùng",
      value: stats?.activeUsers || 0,
      subtext: "Tổng cộng",
      icon: <Users className="h-4 w-4" />,
      color: "bg-purple-500/10 text-purple-500",
      className: "md:col-span-1",
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
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
      className="space-y-6 sm:space-y-8 p-4 md:p-8"
    >
      {/* Header */}
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Hệ thống quản lý</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">Dashboard Tổng quan</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Theo dõi hiệu suất kinh doanh và quản trị hệ thống thời gian thực.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <p className="text-xs text-muted-foreground">Cập nhật lần cuối</p>
            <p className="text-sm font-medium">{new Date().toLocaleTimeString('vi-VN')}</p>
          </div>
        </div>
      </motion.div>

      <BentoGrid className="max-w-none">
        {kpiItems.map((kpi, i) => (
          <motion.div key={i} variants={item} className={kpi.className}>
            <BentoGridItem
              title={isLoading ? <Skeleton className="h-6 w-24" /> : <span className="text-2xl font-bold tracking-tighter">{kpi.value}</span>}
              description={kpi.subtext}
              header={
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{kpi.title}</span>
                  <div className={cn("p-2 rounded-xl", kpi.color)}>{kpi.icon}</div>
                </div>
              }
              className="glass-card border-none hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300"
            />
          </motion.div>
        ))}

        {/* Revenue Chart - Span 2 */}
        <motion.div variants={item} className="md:col-span-2">
          <BentoGridItem
            className="glass-card border-none min-h-[350px] overflow-hidden"
            header={
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <span className="font-bold">Biểu đồ doanh thu</span>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-primary transition-colors" />
              </div>
            }
            children={
              isLoading ? (
                <Skeleton className="h-[250px] w-full" />
              ) : (
                <div className="h-[250px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats?.trends || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FF385C" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#FF385C" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis
                        dataKey="date"
                        stroke="#888888"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => new Date(val).getDate() + '/' + (new Date(val).getMonth() + 1)}
                      />
                      <YAxis
                        stroke="#888888"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '12px', backdropFilter: 'blur(10px)', fontSize: '12px' }}
                        itemStyle={{ color: '#fff' }}
                        formatter={(val: any) => formatCurrency(val)}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#FF385C" strokeWidth={3} fill="url(#colorRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )
            }
          />
        </motion.div>

        {/* Occupancy - Span 2 */}
        <motion.div variants={item} className="md:col-span-2">
          <BentoGridItem
            className="glass-card border-none min-h-[350px] relative"
            header={
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                  <Building2 className="h-5 w-5" />
                </div>
                <span className="font-bold">Tỷ lệ lấp đầy</span>
              </div>
            }
            children={
              isLoading ? <Skeleton className="h-[250px] w-full" /> : (
                <div className="h-[250px] w-full flex items-center justify-center relative mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Đã thuê', value: stats?.occupancyRate || 0 },
                          { name: 'Còn trống', value: 100 - (stats?.occupancyRate || 0) }
                        ]}
                        innerRadius={75}
                        outerRadius={95}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        <Cell fill="#FF385C" />
                        <Cell fill="rgba(255,255,255,0.05)" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-4">
                    <span className="text-5xl font-black tracking-tighter">{stats?.occupancyRate?.toFixed(0)}%</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Occupancy</span>
                  </div>
                </div>
              )
            }
          />
        </motion.div>

        {/* Top Lists */}
        <motion.div variants={item} className="md:col-span-2">
          <BentoGridItem
            className="glass-card border-none"
            header={
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-4 bg-primary rounded-full" />
                <span className="font-bold">Chủ nhà tiêu biểu</span>
              </div>
            }
            children={
              <div className="space-y-3 mt-4">
                {stats?.topPerformers?.landlords?.slice(0, 5).map((l: any, i: number) => (
                  <div key={i} className="flex justify-between items-center bg-white/5 hover:bg-white/10 p-3 rounded-xl transition-colors border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-xs font-bold text-primary">
                        {i + 1}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">{l.name}</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{l.properties} BĐS</span>
                      </div>
                    </div>
                    <span className="font-bold text-primary text-sm">{formatCurrency(l.revenue)}</span>
                  </div>
                ))}
              </div>
            }
          />
        </motion.div>

        <motion.div variants={item} className="md:col-span-2">
          <BentoGridItem
            className="glass-card border-none"
            header={
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-4 bg-blue-500 rounded-full" />
                <span className="font-bold">BĐS Doanh thu cao</span>
              </div>
            }
            children={
              <div className="space-y-3 mt-4">
                {stats?.topPerformers?.properties?.slice(0, 5).map((p: any, i: number) => (
                  <div key={i} className="flex justify-between items-center bg-white/5 hover:bg-white/10 p-3 rounded-xl transition-colors border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center text-xs font-bold text-blue-500">
                        {i + 1}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm truncate max-w-[150px]">{p.name}</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{p.rooms} phòng</span>
                      </div>
                    </div>
                    <span className="font-bold text-blue-500 text-sm">{formatCurrency(p.revenue)}</span>
                  </div>
                ))}
              </div>
            }
          />
        </motion.div>

      </BentoGrid>
    </motion.div>
  );
}
