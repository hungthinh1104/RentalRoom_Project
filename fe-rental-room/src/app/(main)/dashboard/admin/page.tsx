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
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-border/40 pb-4">
        <h1 className="text-3xl font-bold tracking-tight">Tổng quan</h1>
        <p className="text-muted-foreground mt-1">
          Tổng hợp số liệu kinh doanh và tình trạng hệ thống
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          title="Hợp đồng sắp hết hạn"
          value={stats?.expiringContracts || 0}
          subtext="Trong 30 ngày tới"
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

      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Bất động sản
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tổng số bất động sản</span>
                  <span className="text-2xl font-bold">{stats?.totalProperties || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tổng số phòng</span>
                  <span className="text-2xl font-bold">{stats?.totalRooms || 0}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Hiệu suất
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Phòng đã cho thuê</span>
                  <span className="text-2xl font-bold">
                    {Math.round((stats?.totalRooms || 0) * (stats?.occupancyRate || 0) / 100)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Phòng trống</span>
                  <span className="text-2xl font-bold">
                    {(stats?.totalRooms || 0) - Math.round((stats?.totalRooms || 0) * (stats?.occupancyRate || 0) / 100)}
                  </span>
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
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
    </div>
  );
}
