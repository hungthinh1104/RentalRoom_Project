"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { reportsApi, LandlordDashboardSummary } from "@/lib/api/reportsApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Building2, DoorOpen, Activity, Banknote, Wrench, FileWarning } from "lucide-react";

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
    <div className="flex items-end gap-1 h-14 w-full">
      {data.map((d, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm bg-primary/20"
          style={{ height: `${(d.amount / max) * 100}%` }}
          aria-label={`${d.amount}`}
        />
      ))}
    </div>
  );
}

export default function LandlordOverviewPage() {
  const { data: session } = useSession();
  const landlordId = session?.user?.id;
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

  if (!landlordId) {
    return (
      <Alert>
        <AlertDescription>Vui lòng đăng nhập để xem tổng quan.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Tổng quan</h1>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-24 mb-4" />
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))
        ) : (
          summary && (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tài sản</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.summary.totalProperties}</div>
                  <p className="text-xs text-muted-foreground">Tổng số bất động sản</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Phòng</CardTitle>
                  <DoorOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.summary.totalRooms}</div>
                  <p className="text-xs text-muted-foreground">
                    {summary.summary.availableRooms} trống · {summary.summary.occupiedRooms} đang thuê
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tỷ lệ lấp đầy</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {summary.summary.occupancyRate.toFixed(0)}%
                  </div>
                  <p className="text-xs text-muted-foreground">Cập nhật theo trạng thái phòng</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Doanh thu tháng</CardTitle>
                  <Banknote className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    <Vnd value={summary.summary.revenueThisMonth} />
                  </div>
                  <p className="text-xs text-muted-foreground">Đã thu theo hóa đơn</p>
                </CardContent>
              </Card>
            </>
          )
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Doanh thu 6 tháng</CardTitle>
          </CardHeader>
          <CardContent>
            {loading || !summary ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <SparkBars data={summary.revenueLast6Months} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cảnh báo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading || !summary ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <FileWarning className="h-4 w-4 text-destructive" />
                    Hóa đơn quá hạn
                  </div>
                  <span className="text-sm font-medium">{summary.summary.overdueInvoices}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Wrench className="h-4 w-4 text-warning" />
                    Yêu cầu bảo trì mở
                  </div>
                  <span className="text-sm font-medium">{summary.summary.openMaintenance}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
