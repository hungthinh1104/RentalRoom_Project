"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, XCircle, Clock, User, Home, Calendar } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useApplications, useApproveApplication, useRejectApplication } from "@/features/rental-applications/hooks/use-rental-applications";
import type { RentalApplication } from "@/types";

interface ApplicationsListProps {
    view: "landlord" | "tenant";
}

export function ApplicationsList({ view }: ApplicationsListProps) {
    const { data: session } = useSession();
    const userId = session?.user?.id;

    const params = view === "landlord"
        ? { landlordId: userId }
        : { tenantId: userId };

    const { data, isLoading } = useApplications(userId ? params : undefined, { enabled: !!userId });
    const approveMutation = useApproveApplication();
    const rejectMutation = useRejectApplication();

    const applications = data?.data || data?.items || [];

    const handleApprove = async (id: string) => {
        try {
            await approveMutation.mutateAsync(id);
            toast.success("Đã duyệt đơn đăng ký");
        } catch (error) {
            toast.error("Không thể duyệt đơn");
        }
    };

    const handleReject = async (id: string) => {
        try {
            await rejectMutation.mutateAsync({ id, reason: "Phòng đã có người thuê" });
            toast.success("Đã từ chối đơn đăng ký");
        } catch (error) {
            toast.error("Không thể từ chối đơn");
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-40 w-full rounded-xl" />
                ))}
            </div>
        );
    }

    if (applications.length === 0) {
        return (
            <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                    <div className="p-4 rounded-full bg-muted/50 mb-4">
                        <Home className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold">Chưa có đơn đăng ký nào</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        {view === "landlord"
                            ? "Khi có người thuê gửi đơn, nó sẽ xuất hiện tại đây."
                            : "Các đơn đăng ký của bạn sẽ hiển thị ở đây."}
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {applications.map((app: RentalApplication) => (
                <Card key={app.id} className="overflow-hidden">
                    <CardHeader className="bg-muted/30 pb-4">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-lg">
                                    Phòng {app.room?.roomNumber || app.roomId}
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    {app.room?.property?.name || "Đang cập nhật"}
                                </p>
                            </div>
                            <Badge
                                variant={
                                    app.status === "APPROVED"
                                        ? "default"
                                        : app.status === "REJECTED"
                                            ? "destructive"
                                            : "outline"
                                }
                            >
                                {app.status === "PENDING" && "Chờ duyệt"}
                                {app.status === "APPROVED" && "Đã duyệt"}
                                {app.status === "REJECTED" && "Từ chối"}
                                {app.status === "WITHDRAWN" && "Đã rút"}
                            </Badge>
                        </div>
                    </CardHeader>

                    <CardContent className="pt-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Người thuê:</span>
                                <span className="font-medium">
                                    {app.tenant?.user?.fullName || app.tenantEmail || "—"}
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Ngày gửi:</span>
                                <span className="font-medium">
                                    {format(new Date(app.createdAt), "dd/MM/yyyy")}
                                </span>
                            </div>
                        </div>

                        {app.message && (
                            <div className="p-3 rounded-lg bg-muted/50">
                                <p className="text-sm font-medium mb-1">Tin nhắn:</p>
                                <p className="text-sm text-muted-foreground">{app.message}</p>
                            </div>
                        )}

                        {view === "landlord" && app.status === "PENDING" && (
                            <div className="flex gap-3 pt-2">
                                <Button
                                    onClick={() => handleApprove(app.id)}
                                    disabled={approveMutation.isPending}
                                    className="flex-1 gap-2"
                                >
                                    <CheckCircle className="h-4 w-4" />
                                    Duyệt đơn
                                </Button>
                                <Button
                                    onClick={() => handleReject(app.id)}
                                    disabled={rejectMutation.isPending}
                                    variant="outline"
                                    className="flex-1 gap-2"
                                >
                                    <XCircle className="h-4 w-4" />
                                    Từ chối
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
