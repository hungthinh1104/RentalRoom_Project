"use client";
import React from 'react';
import { format } from 'date-fns';
import { useSession } from 'next-auth/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useApplication } from '@/features/contracts/hooks/use-contracts';
import { useWithdrawApplication } from '@/features/contracts/hooks/use-contracts';
import { ApplicationStatus, type RentalApplication } from '@/types';
import { useToast } from '@/hooks/use-toast';

function formatDate(value?: string | null) {
  return value ? format(new Date(value), 'dd/MM/yyyy HH:mm') : '—';
}

function statusBadge(status?: ApplicationStatus) {
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

export default function BookingDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = React.use(props.params);
  const { data: session } = useSession();
  const appQuery = useApplication(id);
  const application: RentalApplication | undefined = appQuery.data ?? undefined;
  const withdrawMutation = useWithdrawApplication();
  const { toast } = useToast();

  const handleWithdraw = async () => {
    try {
      await withdrawMutation.mutateAsync(id);
      toast({ title: 'Đã rút đơn', description: 'Đơn của bạn đã được rút.' });
    } catch (error: any) {
      toast({ title: 'Lỗi', description: error?.message || 'Không thể rút đơn', variant: 'destructive' });
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
      <Card className="rounded-2xl">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Chi tiết đơn đặt phòng</CardTitle>
          {appQuery.isLoading ? <Skeleton className="h-6 w-24" /> : statusBadge(application?.status)}
        </CardHeader>

        <CardContent>
          {appQuery.isLoading && (
            <div className="space-y-3">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-40 w-full rounded-lg" />
            </div>
          )}

          {!appQuery.isLoading && !application && (
            <div className="text-center py-8 text-muted-foreground">Không tìm thấy đơn đặt phòng.</div>
          )}

          {!appQuery.isLoading && application && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold">Phòng</h3>
                <p className="text-sm text-muted-foreground">{application.room?.roomNumber ?? application.room?.property?.name ?? application.roomAddress ?? '—'}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium">Người đăng ký</h4>
                  <p className="text-sm text-muted-foreground">{application.tenantName ?? application.tenant?.user?.fullName ?? '—'}</p>
                  <p className="text-sm text-muted-foreground">{application.tenantEmail ?? application.tenant?.user?.email ?? '—'}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium">Ngày đăng ký</h4>
                  <p className="text-sm text-muted-foreground">{formatDate(application.createdAt)}</p>
                  <h4 className="text-sm font-medium mt-3">Tin nhắn</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{application.message ?? 'Không có'}</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                {application.status !== ApplicationStatus.WITHDRAWN && application.status !== ApplicationStatus.REJECTED && (
                  <Button variant="destructive" onClick={handleWithdraw} disabled={withdrawMutation.isLoading}>
                    Rút đơn
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
