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
  Percent
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

function KPICard({
  title,
  value,
  subtext,
  icon: Icon,
  trend,
  loading,
}: {
  title: string;
  value: string | number;
  subtext: string;
  icon: React.ComponentType<{ className: string }>;
  trend?: "up" | "down" | "neutral";
  loading?: boolean;
}) {
  return (
    <Card className="border border-border/50 bg-gradient-to-br from-card to-card/50 hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={cn(
          "p-2 rounded-lg",
          "bg-primary/10 text-primary"
        )}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <>
            <Skeleton className="h-8 w-24 mb-1" />
            <Skeleton className="h-4 w-32" />
          </>
        ) : (
          <>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{subtext}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

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

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="border-b border-border/40 pb-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Tổng quan</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Tổng hợp số liệu kinh doanh và tình trạng hệ thống
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Tổng doanh thu"
          value={formatCurrency(stats?.totalRevenue || 0)}
          subtext="Tháng này"
          icon={DollarSign}
          loading={isLoading}
        />
        <KPICard
          title="Tỷ lệ lấp đầy"
          value={`${stats?.occupancyRate || 0}%`}
          subtext="Phòng đang sử dụng"
          icon={Percent}
          loading={isLoading}
        />
        <KPICard
          title="Hợp đồng đang hoạt động"
          value={stats?.expiringContracts || 0}
          subtext="Đang có hiệu lực"
          icon={Clock}
          loading={isLoading}
        />
        <KPICard
          title="Người dùng hoạt động"
          value={stats?.activeUsers || 0}
          subtext="Tổng cộng"
          icon={Users}
          loading={isLoading}
        />
      </div>

      {/* Charts Overview */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
        {/* Revenue Trend Chart */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Biểu đồ doanh thu
            </CardTitle>
          </CardHeader>
          <CardContent className="pl-0">
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <div className="h-[300px] w-full">
                {stats?.trends && stats.trends.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.trends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="date"
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return `${date.getDate()}/${date.getMonth() + 1}`;
                        }}
                      />
                      <YAxis
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                      />
                      <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }}
                        formatter={(value: any) => [formatCurrency(Number(value)), "Doanh thu"]}
                        labelFormatter={(value) => new Date(value).toLocaleDateString('vi-VN')}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="var(--color-primary)"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    Chưa có dữ liệu xu hướng
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Occupancy Chart */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Tỷ lệ lấp đầy
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <div className="h-[300px] w-full flex flex-col items-center justify-center">
                <div className="relative w-48 h-48 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Đã thuê', value: stats?.occupancyRate || 0, fill: 'var(--color-primary)' },
                          { name: 'Còn trống', value: 100 - (stats?.occupancyRate || 0), fill: 'var(--muted)' }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell key="occupied" fill="hsl(var(--primary))" />
                        <Cell key="vacant" fill="hsl(var(--muted))" />
                      </Pie>
                      <Tooltip
                        formatter={(value: any) => [`${Number(value).toFixed(1)}%`, ""]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-bold">{stats?.occupancyRate?.toFixed(0)}%</span>
                    <span className="text-xs text-muted-foreground uppercase">Tỷ lệ lấp đầy</span>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-4 w-full px-8">
                  <div className="flex flex-col items-center p-3 rounded-lg bg-accent/50">
                    <span className="text-2xl font-bold text-primary">
                      {Math.round((stats?.totalRooms || 0) * (stats?.occupancyRate || 0) / 100)}
                    </span>
                    <span className="text-xs text-muted-foreground">Phòng đã thuê</span>
                  </div>
                  <div className="flex flex-col items-center p-3 rounded-lg bg-accent/50">
                    <span className="text-2xl font-bold text-muted-foreground">
                      {(stats?.totalRooms || 0) - Math.round((stats?.totalRooms || 0) * (stats?.occupancyRate || 0) / 100)}
                    </span>
                    <span className="text-xs text-muted-foreground">Phòng trống</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Truy cập nhanh</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <a
              href="/dashboard/admin/users"
              className={cn(
                "flex items-center gap-3 p-4 rounded-lg border",
                "hover:bg-accent hover:text-accent-foreground transition-colors"
              )}
            >
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Người dùng</p>
                <p className="text-sm text-muted-foreground">Quản lý tài khoản</p>
              </div>
            </a>
            <a
              href="/dashboard/admin/properties"
              className={cn(
                "flex items-center gap-3 p-4 rounded-lg border",
                "hover:bg-accent hover:text-accent-foreground transition-colors"
              )}
            >
              <Building2 className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Bất động sản</p>
                <p className="text-sm text-muted-foreground">Xem tất cả</p>
              </div>
            </a>
            <a
              href="/dashboard/admin/contracts"
              className={cn(
                "flex items-center gap-3 p-4 rounded-lg border",
                "hover:bg-accent hover:text-accent-foreground transition-colors"
              )}
            >
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Hợp đồng</p>
                <p className="text-sm text-muted-foreground">Theo dõi hợp đồng</p>
              </div>
            </a>
            <a
              href="/dashboard/admin/payments"
              className={cn(
                "flex items-center gap-3 p-4 rounded-lg border",
                "hover:bg-accent hover:text-accent-foreground transition-colors"
              )}
            >
              <DollarSign className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Thanh toán</p>
                <p className="text-sm text-muted-foreground">Quản lý hóa đơn</p>
              </div>
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Top Performers */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Top Landlords */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Chủ nhà tiêu biểu
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {stats?.topPerformers?.landlords?.length ? (
                  stats.topPerformers.landlords.slice(0, 5).map((landlord: any, i: number) => (
                    <div key={landlord.landlordId} className="flex items-center justify-between border-b last:border-0 pb-3 last:pb-0">
                      <div>
                        <p className="font-medium">{landlord.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {landlord.properties} BĐS • {landlord.occupancyRate.toFixed(1)}% lấp đầy
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm text-primary">
                          {formatCurrency(landlord.revenue)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">Chưa có dữ liệu</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Properties */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Bất động sản doanh thu cao
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {stats?.topPerformers?.properties?.length ? (
                  stats.topPerformers.properties.slice(0, 5).map((property: any, i: number) => (
                    <div key={property.propertyId} className="flex items-center justify-between border-b last:border-0 pb-3 last:pb-0">
                      <div>
                        <p className="font-medium truncate max-w-[180px] sm:max-w-[240px]">{property.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {property.landlord}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm text-primary">
                          {formatCurrency(property.revenue)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {property.occupancyRate.toFixed(1)}% đầy
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">Chưa có dữ liệu</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
