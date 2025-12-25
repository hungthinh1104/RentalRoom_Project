"use client";

import * as React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApplications, useApproveApplication, useRejectApplication, useWithdrawApplication } from "@/features/contracts/hooks/use-contracts";
import { ApplicationStatus, type RentalApplication } from "@/types";
import { useToast } from "@/hooks/use-toast";

function formatDate(value?: string | null) {
  return value ? format(new Date(value), "dd/MM/yyyy HH:mm") : "—";
}

function StatusPill({ status }: { status?: ApplicationStatus }) {
  switch (status) {
    case ApplicationStatus.APPROVED:
      return <Badge className="bg-success-light text-success border-success/20">Đã duyệt</Badge>;
    case ApplicationStatus.REJECTED:
      return <Badge className="bg-destructive-light text-destructive border-destructive/20">Bị từ chối</Badge>;
    case ApplicationStatus.WITHDRAWN:
      return <Badge className="bg-muted text-muted-foreground border-border">Đã rút</Badge>;
    default:
      return <Badge className="bg-warning-light text-warning border-warning/20">Chờ duyệt</Badge>;
  }
}

export type ApplicationsListProps = {
  view?: "tenant" | "landlord";
  pageSize?: number;
};

export function ApplicationsList({ view = "tenant", pageSize = 10 }: ApplicationsListProps) {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const { toast } = useToast();

  const [page, setPage] = React.useState<number>(1);
  const [status, setStatus] = React.useState<"ALL" | keyof typeof ApplicationStatus>("ALL");

  const params = React.useMemo(() => {
    const base: any = { page, limit: pageSize };
    if (view === "tenant") base.tenantId = userId;
    else base.landlordId = userId;
    if (status !== "ALL") base.status = status;
    return base;
  }, [page, pageSize, status, userId, view]);

  const appsQuery = useApplications(params, { enabled: !!userId });

  const approveMutation = useApproveApplication();
  const rejectMutation = useRejectApplication();
  const withdrawMutation = useWithdrawApplication();

  const onApprove = React.useCallback(async (id: string) => {
    try {
      await approveMutation.mutateAsync(id);
      toast({ title: "Đã duyệt đơn", description: "Đơn đăng ký đã được chấp thuận." });
    } catch (e: any) {
      toast({ title: "Lỗi", description: e?.message ?? "Không thể duyệt đơn", variant: "destructive" });
    }
  }, [approveMutation, toast]);

  const onReject = React.useCallback(async (id: string) => {
    try {
      await rejectMutation.mutateAsync(id);
      toast({ title: "Đã từ chối", description: "Đơn đăng ký đã bị từ chối." });
    } catch (e: any) {
      toast({ title: "Lỗi", description: e?.message ?? "Không thể từ chối", variant: "destructive" });
    }
  }, [rejectMutation, toast]);

  const onWithdraw = React.useCallback(async (id: string) => {
    try {
      await withdrawMutation.mutateAsync(id);
      toast({ title: "Đã rút đơn", description: "Bạn đã rút đơn đăng ký." });
    } catch (e: any) {
      toast({ title: "Lỗi", description: e?.message ?? "Không thể rút đơn", variant: "destructive" });
    }
  }, [withdrawMutation, toast]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <Card className="rounded-2xl">
        <CardHeader className="flex items-center justify-between gap-4 flex-wrap">
          <CardTitle>
            {view === "tenant" ? "Đơn đăng ký của tôi" : "Đơn đăng ký nhận được"}
          </CardTitle>
          <div className="flex items-center gap-3">
            <Select value={status} onValueChange={(v) => { setPage(1); setStatus(v as any); }}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Lọc theo trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                <SelectItem value="PENDING">Chờ duyệt</SelectItem>
                <SelectItem value="APPROVED">Đã duyệt</SelectItem>
                <SelectItem value="REJECTED">Bị từ chối</SelectItem>
                <SelectItem value="WITHDRAWN">Đã rút</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {appsQuery.isLoading && (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-12 items-center gap-4 p-4 rounded-xl border border-border/60">
                  <Skeleton className="h-5 w-40 md:col-span-3" />
                  <Skeleton className="h-5 w-48 md:col-span-3" />
                  <Skeleton className="h-5 w-28 md:col-span-2" />
                  <Skeleton className="h-5 w-28 md:col-span-2" />
                  <div className="md:col-span-2 flex justify-end gap-2">
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-24" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!appsQuery.isLoading && (!appsQuery.data || appsQuery.data.meta?.total === 0 || appsQuery.data.data?.length === 0) && (
            <div className="text-center py-10 text-muted-foreground">
              Chưa có đơn nào.
            </div>
          )}

          {!appsQuery.isLoading && appsQuery.data && (
            <div className="space-y-3">
              {appsQuery.data.data.map((app: RentalApplication) => (
                <div key={app.id} className="grid grid-cols-1 md:grid-cols-12 items-center gap-4 p-4 rounded-xl border border-border/60 bg-card/50">
                  <div className="md:col-span-3">
                    <div className="text-sm text-muted-foreground">Phòng</div>
                    <div className="font-medium">{app.room?.roomNumber ?? app.roomAddress ?? "—"}</div>
                  </div>
                  <div className="md:col-span-3">
                    <div className="text-sm text-muted-foreground">Người đăng ký</div>
                    <div className="font-medium">{app.tenant?.user?.fullName ?? app.tenantName ?? "—"}</div>
                  </div>
                  <div className="md:col-span-2">
                    <div className="text-sm text-muted-foreground">Ngày đăng ký</div>
                    <div className="font-medium">{formatDate(app.createdAt)}</div>
                  </div>
                  <div className="md:col-span-2">
                    <div className="text-sm text-muted-foreground">Trạng thái</div>
                    <div className="mt-1"><StatusPill status={app.status as ApplicationStatus} /></div>
                  </div>
                  <div className="md:col-span-2 flex justify-end gap-2">
                    {view === "landlord" && app.status === ApplicationStatus.PENDING && (
                      <>
                        <Button size="sm" variant="default" onClick={() => onApprove(app.id)} disabled={approveMutation.isLoading}>
                          Duyệt
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => onReject(app.id)} disabled={rejectMutation.isLoading}>
                          Từ chối
                        </Button>
                      </>
                    )}
                    {view === "tenant" && app.status === ApplicationStatus.PENDING && (
                      <Button size="sm" variant="destructive" onClick={() => onWithdraw(app.id)} disabled={withdrawMutation.isLoading}>
                        Rút đơn
                      </Button>
                    )}
                    {view === "tenant" && (
                      <Link href={`/dashboard/tenant/bookings/${app.id}`} className="inline-flex">
                        <Button size="sm" variant="outline">Xem chi tiết</Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!appsQuery.isLoading && appsQuery.data && (
            <div className="flex items-center justify-between gap-3 pt-6">
              <div className="text-sm text-muted-foreground">
                Trang {appsQuery.data.meta.page} / {appsQuery.data.meta.totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={appsQuery.data.meta.page <= 1}
                >
                  Trang trước
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setPage((p) => Math.min(appsQuery.data!.meta.totalPages, p + 1))}
                  disabled={appsQuery.data.meta.page >= appsQuery.data.meta.totalPages}
                >
                  Trang sau
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
