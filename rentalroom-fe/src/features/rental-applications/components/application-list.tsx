"use client";

import * as React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApplications, useApproveApplication, useRejectApplication, useWithdrawApplication } from "@/features/rental-applications/hooks/use-rental-applications";
import { ApplicationStatus, PaginationParams, type RentalApplication } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { ApplicationStatusBadge } from "./application-status-badge";
import { ApplicationDetailDrawer } from "./application-detail-drawer";

function formatDate(value?: string | null) {
  return value ? format(new Date(value), "dd/MM/yyyy HH:mm") : "—";
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
  const [status, setStatus] = React.useState<string>("ALL");
  const [selectedApp, setSelectedApp] = React.useState<RentalApplication | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

  const openDrawer = (app: RentalApplication) => {
    setSelectedApp(app);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedApp(null);
  };

  const params = React.useMemo(() => {
    const base: PaginationParams & { tenantId?: string; landlordId?: string; status?: string } = { page, limit: pageSize };
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
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast({ title: "Lỗi", description: msg || "Không thể duyệt đơn", variant: "destructive" });
    }
  }, [approveMutation, toast]);

  const onReject = React.useCallback(async (id: string) => {
    try {
      if (confirm("Bạn có chắc chắn muốn từ chối đơn này?")) {
        await rejectMutation.mutateAsync({ id });
        toast({ title: "Đã từ chối", description: "Đơn đăng ký đã bị từ chối." });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast({ title: "Lỗi", description: msg || "Không thể từ chối", variant: "destructive" });
    }
  }, [rejectMutation, toast]);

  const onWithdraw = React.useCallback(async (id: string) => {
    try {
      if (confirm("Bạn có chắc chắn muốn rút đơn đăng ký này?")) {
        await withdrawMutation.mutateAsync(id);
        toast({ title: "Đã rút đơn", description: "Bạn đã rút đơn đăng ký." });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast({ title: "Lỗi", description: msg || "Không thể rút đơn", variant: "destructive" });
    }
  }, [withdrawMutation, toast]);

  const handleTabChange = (val: string) => {
    setStatus(val);
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <ApplicationDetailDrawer
        application={selectedApp}
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
      />

      <Card className="rounded-2xl shadow-none border-none sm:border bg-transparent sm:bg-card">
        <CardHeader className="px-0 sm:px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>
              {view === "tenant" ? "Đơn đăng ký của tôi" : "Đơn đăng ký nhận được"}
            </CardTitle>

            <Tabs value={status} onValueChange={handleTabChange} className="w-full sm:w-auto">
              <TabsList className="grid w-full grid-cols-5 sm:w-auto sm:inline-flex">
                <TabsTrigger value="ALL">Tất cả</TabsTrigger>
                <TabsTrigger value="PENDING">Chờ duyệt</TabsTrigger>
                <TabsTrigger value="APPROVED">Đã duyệt</TabsTrigger>
                <TabsTrigger value="REJECTED">Đã hủy</TabsTrigger>
                <TabsTrigger value="COMPLETED">Hoàn tất</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          {appsQuery.isLoading && (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-4 p-4 rounded-xl border border-border/60">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          )}

          {!appsQuery.isLoading && (!appsQuery.data || appsQuery.data.meta?.total === 0 || appsQuery.data.data?.length === 0) && (
            <div className="text-center py-16 text-muted-foreground border border-dashed rounded-xl bg-muted/20">
              Chưa có đơn đăng ký nào trong mục này.
            </div>
          )}

          {!appsQuery.isLoading && appsQuery.data && (
            <div className="space-y-4">
              {appsQuery.data.data.map((app: RentalApplication) => (
                <div key={app.id} onClick={() => openDrawer(app)} className="group cursor-pointer grid grid-cols-1 md:grid-cols-12 gap-4 p-5 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-all">
                  <div className="md:col-span-4 space-y-1">
                    <div className="text-sm font-medium text-muted-foreground">Phòng</div>
                    <div className="font-semibold text-lg text-primary group-hover:text-primary/90">{app.room?.roomNumber ?? app.roomAddress ?? "—"}</div>
                    <div className="text-sm text-muted-foreground">{app.roomAddress}</div>
                  </div>

                  <div className="md:col-span-3 space-y-1">
                    <div className="text-sm font-medium text-muted-foreground">Người đăng ký</div>
                    <div className="font-medium">{app.tenant?.user?.fullName ?? app.tenantName ?? "—"}</div>
                    <div className="text-sm text-muted-foreground">{formatDate(app.createdAt)}</div>
                  </div>

                  <div className="md:col-span-2 space-y-1">
                    <div className="text-sm font-medium text-muted-foreground">Trạng thái</div>
                    <div><ApplicationStatusBadge status={app.status as ApplicationStatus} /></div>
                  </div>

                  <div className="md:col-span-3 flex flex-col sm:flex-row justify-end items-start sm:items-center gap-2">
                    <div className="w-full sm:w-auto flex gap-2" onClick={(e) => e.stopPropagation()}>
                      {view === "landlord" && app.status === ApplicationStatus.PENDING && (
                        <>
                          <Button size="sm" className="flex-1 sm:flex-none" onClick={() => onApprove(app.id)} disabled={approveMutation.isPending}>
                            Duyệt
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 sm:flex-none" onClick={() => onReject(app.id)} disabled={rejectMutation.isPending}>
                            Từ chối
                          </Button>
                        </>
                      )}

                      {view === "landlord" && app.status === ApplicationStatus.APPROVED && !app.contractId && (
                        <Link href={`/dashboard/landlord/contracts/create?applicationId=${app.id}`} className="w-full sm:w-auto">
                          <Button size="sm" variant="default" className="w-full bg-primary hover:bg-primary/90">Tạo hợp đồng</Button>
                        </Link>
                      )}

                      {view === "tenant" && app.status === ApplicationStatus.PENDING && (
                        <Button size="sm" variant="destructive" className="w-full sm:w-auto" onClick={() => onWithdraw(app.id)} disabled={withdrawMutation.isPending}>
                          Rút đơn
                        </Button>
                      )}

                      <Button size="sm" variant="ghost" className="hidden sm:inline-flex" onClick={(e) => { e.stopPropagation(); openDrawer(app); }}>
                        Chi tiết
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!appsQuery.isLoading && appsQuery.data && appsQuery.data.meta && appsQuery.data.meta.totalPages > 1 && (
            <div className="flex items-center justify-between gap-3 pt-6">
              <div className="text-sm text-muted-foreground">
                Trang {appsQuery.data.meta.page} / {appsQuery.data.meta.totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={appsQuery.data.meta.page <= 1}
                >
                  Trang trước
                </Button>
                <Button
                  size="sm"
                  variant="outline"
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
