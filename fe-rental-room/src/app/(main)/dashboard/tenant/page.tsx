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
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTenantDashboard } from "@/features/tenant/hooks/use-tenant-dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import type { Payment, RoomSummary } from "@/features/tenant/api/dashboard-api";

const quickStats = [
  {
    label: "Đặt phòng đang hiệu lực",
    field: "bookings",
    icon: Home,
  },
  {
    label: "Hợp đồng",
    field: "contracts",
    icon: FileText,
  },
  {
    label: "Thanh toán chờ",
    field: "payments",
    icon: CreditCard,
  },
  {
    label: "Bảo trì đang mở",
    field: "maintenance",
    icon: AlertCircle,
  },
];

const quickActions = [
  { href: "/dashboard/tenant/bookings", label: "Đặt phòng của tôi", icon: Home },
  { href: "/dashboard/tenant/contracts", label: "Hợp đồng", icon: FileText },
  { href: "/dashboard/tenant/payments", label: "Thanh toán", icon: CreditCard },
  { href: "/dashboard/tenant/maintenance", label: "Bảo trì", icon: AlertCircle },
  { href: "/dashboard/tenant/utilities", label: "Điện nước", icon: Zap },
  { href: "/dashboard/tenant/favorites", label: "Yêu thích", icon: Heart },
];

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

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Welcome / hero */}
      <Card className="border border-border bg-gradient-to-br from-primary/5 via-card to-card/80 backdrop-blur-xl rounded-[28px] shadow-xl shadow-muted/30">
        <CardHeader className="space-y-3 pb-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="space-y-3">
              <Badge className="bg-primary/15 text-primary border-primary/30 font-semibold">Bảng điều khiển người thuê</Badge>
              <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                <ShieldCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                Trạng thái: Tài khoản an toàn
              </div>
            </div>
            <Button asChild className="gap-2 shadow-md hover:shadow-lg transition-shadow">
              <Link href="/rooms">
                <Sparkles className="w-4 h-4" />
                Tìm phòng mới
              </Link>
            </Button>
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              Chào {name} 👋
            </h1>
            <p className="text-muted-foreground text-lg font-medium">
              Quản lý đặt phòng, hợp đồng, thanh toán và bảo trì của bạn ở một nơi.
            </p>
          </div>
        </CardHeader>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((item) => (
          <Card
            key={item.label}
            className="border border-border bg-card/80 backdrop-blur-xl rounded-[24px] shadow-lg shadow-muted/20 hover:shadow-xl hover:border-primary/20 transition-all duration-200"
          >
            <CardContent className="p-6 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <item.icon className="w-5 h-5 text-primary" />
                {item.label}
              </div>
              <div className="text-4xl font-bold text-foreground">
                {item.field === "contracts" && contractsQuery.isLoading ? (
                  <Skeleton className="h-7 w-10" />
                ) : item.field === "payments" && paymentsQuery.isLoading ? (
                  <Skeleton className="h-7 w-10" />
                ) : (
                  stats[item.field as keyof typeof stats] ?? 0
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions + Upcoming payments */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 border border-border bg-card/80 backdrop-blur-xl rounded-[28px] shadow-xl shadow-muted/30">
          <CardHeader className="pb-0">
            <h2 className="text-lg font-semibold text-foreground">Hành động nhanh</h2>
            <p className="text-sm text-muted-foreground">Truy cập nhanh các mục bạn dùng nhiều nhất</p>
          </CardHeader>
          <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {quickActions.map((action) => (
              <Button key={action.href} asChild variant="outline" className="w-full justify-start gap-2">
                <Link href={action.href}>
                  <action.icon className="w-4 h-4" />
                  {action.label}
                </Link>
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card className="border border-border bg-card/80 backdrop-blur-xl rounded-[28px] shadow-xl shadow-muted/30">
          <CardHeader className="pb-0 flex flex-row items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Thanh toán sắp tới</h2>
              <p className="text-sm text-muted-foreground">Hạn thanh toán gần nhất</p>
            </div>
            <Badge variant="secondary" className="text-xs">Chờ</Badge>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {paymentsQuery.isLoading && <Skeleton className="h-24 w-full" />}
            {!paymentsQuery.isLoading && paymentsQuery.data?.items?.length === 0 && (
              <p className="text-sm text-muted-foreground">Chưa có hóa đơn chờ</p>
            )}
            {!paymentsQuery.isLoading && paymentsQuery.data?.items?.map((item: Payment) => (
              <div key={item.id} className="flex items-start justify-between rounded-2xl border border-border/80 p-4 bg-muted/40">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">Hóa đơn {item.invoiceId ?? item.id}</p>
                  <p className="text-sm text-muted-foreground">{item.amount ? `${item.amount.toLocaleString('vi-VN')}đ` : '—'}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock3 className="w-4 h-4" />
                    Đến hạn: {item.dueDate ?? '—'}
                  </div>
                </div>
                <Button asChild size="sm" className="gap-1">
                  <Link href="/dashboard/tenant/payments">
                    Thanh toán
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Favorites & recommendations */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="border border-border bg-card/80 backdrop-blur-xl rounded-[28px] shadow-xl shadow-muted/30">
          <CardHeader className="pb-0 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Phòng yêu thích</h2>
              <p className="text-sm text-muted-foreground">Các phòng bạn đã lưu</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/tenant/favorites">Xem tất cả</Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {favoritesQuery.isLoading && <Skeleton className="h-24 w-full" />}
            {!favoritesQuery.isLoading && favoritesQuery.data?.items?.length === 0 && (
              <p className="text-sm text-muted-foreground">Chưa có phòng yêu thích</p>
            )}
            {!favoritesQuery.isLoading && favoritesQuery.data?.items?.map((room: RoomSummary) => (
              <div key={room.id} className="flex items-center justify-between rounded-2xl border border-border/80 p-4 bg-muted/40">
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">{room.name ?? 'Phòng'}</p>
                  <p className="text-sm text-muted-foreground">{room.city ?? ''} {room.ward ? `- ${room.ward}` : ''}</p>
                  {room.pricePerMonth && (
                    <p className="text-sm text-primary font-semibold">{room.pricePerMonth.toLocaleString('vi-VN')}đ / tháng</p>
                  )}
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href="/rooms">Xem phòng</Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border border-border bg-card/80 backdrop-blur-xl rounded-[28px] shadow-xl shadow-muted/30">
          <CardHeader className="pb-0 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Gợi ý cho bạn</h2>
              <p className="text-sm text-muted-foreground">Dựa trên lịch sử và ngân sách</p>
            </div>
            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">AI đề xuất</Badge>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {recommendationsQuery.isLoading && <Skeleton className="h-24 w-full" />}
            {!recommendationsQuery.isLoading && recommendationsQuery.data?.items?.length === 0 && (
              <p className="text-sm text-muted-foreground">Chưa có gợi ý</p>
            )}
            {!recommendationsQuery.isLoading && recommendationsQuery.data?.items?.map((item: RoomSummary) => (
              <div key={item.id} className="rounded-2xl border border-border/80 p-4 bg-muted/40 space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Gợi ý từ hệ thống
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">{item.name ?? 'Phòng gợi ý'}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      {item.city ?? ''} {item.ward ? `- ${item.ward}` : ''}
                    </div>
                    {item.pricePerMonth && (
                      <p className="text-sm text-primary font-semibold">{item.pricePerMonth.toLocaleString('vi-VN')}đ / tháng</p>
                    )}
                  </div>
                  <Button asChild size="sm" className="gap-1">
                    <Link href={`/rooms/${item.id}`}>Xem chi tiết</Link>
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
