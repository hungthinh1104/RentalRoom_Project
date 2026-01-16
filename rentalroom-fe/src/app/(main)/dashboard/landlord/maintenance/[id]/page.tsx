'use client';

import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    ArrowLeft,
    Wrench,
    User,
    Home,
    Calendar,
    Clock,
    AlertCircle,
    CheckCircle2,
    XCircle,
    MessageSquare,
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { MaintenanceStatus, MaintenancePriority } from '@/types/enums';
import api from '@/lib/api/client';
import { toast } from 'sonner';
import { MaintenanceRequest } from '@/types';

export default function LandlordMaintenanceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { data: session } = useSession();
    const requestId = params.id as string;

    const { data: request, isLoading, error } = useQuery({
        queryKey: ['maintenance-detail', requestId],
        queryFn: async () => {
            const { data } = await api.get<MaintenanceRequest>(`/maintenance/requests/${requestId}`);
            return data;
        },
        enabled: !!requestId,
    });

    const updateStatusMutation = useMutation({
        mutationFn: async (status: MaintenanceStatus) => {
            const { data } = await api.patch(`/maintenance/requests/${requestId}`, { status });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['maintenance-detail', requestId] });
            queryClient.invalidateQueries({ queryKey: ['landlord-maintenance'] });
            toast.success('Cập nhật trạng thái thành công');
        },
        onError: () => {
            toast.error('Không thể cập nhật trạng thái');
        },
    });

    const getStatusBadge = (status: MaintenanceStatus) => {
        const variants = {
            PENDING: { variant: 'secondary' as const, icon: Clock, label: 'Chờ xử lý', color: 'text-yellow-600' },
            IN_PROGRESS: { variant: 'default' as const, icon: AlertCircle, label: 'Đang xử lý', color: 'text-blue-600' },
            COMPLETED: { variant: 'default' as const, icon: CheckCircle2, label: 'Hoàn thành', color: 'text-green-600' },
            CANCELLED: { variant: 'destructive' as const, icon: XCircle, label: 'Đã hủy', color: 'text-red-600' },
        };
        const config = variants[status];
        const Icon = config.icon;
        return (
            <Badge variant={config.variant} className={`gap-1 ${config.color}`}>
                <Icon className="w-3 h-3" />
                {config.label}
            </Badge>
        );
    };

    const getPriorityBadge = (priority: MaintenancePriority) => {
        const variants = {
            LOW: { variant: 'secondary' as const, label: 'Thấp' },
            MEDIUM: { variant: 'default' as const, label: 'Trung bình' },
            HIGH: { variant: 'destructive' as const, label: 'Cao' },
            URGENT: { variant: 'destructive' as const, label: '🔴 Khẩn cấp' },
        };
        const config = variants[priority];
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    if (isLoading) {
        return (
            <div className="container py-6 space-y-6">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-96" />
            </div>
        );
    }

    if (error || !request) {
        return (
            <div className="container py-6">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        Không tìm thấy yêu cầu bảo trì này hoặc bạn không có quyền truy cập.
                    </AlertDescription>
                </Alert>
                <Button variant="outline" onClick={() => router.back()} className="mt-4">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Quay lại
                </Button>
            </div>
        );
    }

    return (
        <div className="container py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Quay lại
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold">Chi tiết yêu cầu bảo trì</h1>
                    <p className="text-muted-foreground text-sm">Xem và quản lý yêu cầu #{requestId.slice(0, 8)}</p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Request Info Card */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Wrench className="w-5 h-5" />
                                    {request.title}
                                </CardTitle>
                                <div className="flex gap-2">
                                    {getStatusBadge(request.status)}
                                    {getPriorityBadge(request.priority)}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="text-sm font-medium mb-2">Mô tả</h4>
                                <p className="text-muted-foreground">{request.description}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                <div className="flex items-center gap-2 text-sm">
                                    <User className="w-4 h-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-muted-foreground">Người yêu cầu</p>
                                        <p className="font-medium">{request.tenant?.user?.fullName || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Home className="w-4 h-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-muted-foreground">Phòng</p>
                                        <p className="font-medium">{request.room?.roomNumber || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-muted-foreground">Ngày tạo</p>
                                        <p className="font-medium">
                                            {format(new Date(request.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-muted-foreground">Loại</p>
                                        <p className="font-medium">{request.category}</p>
                                    </div>
                                </div>
                            </div>

                            {request.cost && (
                                <div className="pt-4 border-t">
                                    <p className="text-sm text-muted-foreground">Chi phí ước tính</p>
                                    <p className="text-lg font-bold text-primary">
                                        {Number(request.cost).toLocaleString('vi-VN')}đ
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Feedback Card (if completed) */}
                    {request.status === 'COMPLETED' && request.feedback && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Phản hồi từ khách thuê</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {request.rating && (
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-sm text-muted-foreground">Đánh giá:</span>
                                        <span className="font-bold">{request.rating}/5</span>
                                    </div>
                                )}
                                <p className="text-muted-foreground">{request.feedback}</p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar - Actions */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Hành động</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {request.status === 'PENDING' && (
                                <Button
                                    className="w-full"
                                    onClick={() => updateStatusMutation.mutate(MaintenanceStatus.IN_PROGRESS)}
                                    disabled={updateStatusMutation.isPending}
                                >
                                    Bắt đầu xử lý
                                </Button>
                            )}
                            {request.status === 'IN_PROGRESS' && (
                                <Button
                                    className="w-full"
                                    onClick={() => updateStatusMutation.mutate(MaintenanceStatus.COMPLETED)}
                                    disabled={updateStatusMutation.isPending}
                                >
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Đánh dấu hoàn thành
                                </Button>
                            )}
                            {(request.status === 'PENDING' || request.status === 'IN_PROGRESS') && (
                                <Button
                                    variant="destructive"
                                    className="w-full"
                                    onClick={() => updateStatusMutation.mutate(MaintenanceStatus.CANCELLED)}
                                    disabled={updateStatusMutation.isPending}
                                >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Hủy yêu cầu
                                </Button>
                            )}
                            {request.status === 'COMPLETED' && (
                                <Alert>
                                    <CheckCircle2 className="h-4 w-4" />
                                    <AlertDescription>
                                        Yêu cầu này đã được hoàn thành.
                                    </AlertDescription>
                                </Alert>
                            )}
                            {request.status === 'CANCELLED' && (
                                <Alert variant="destructive">
                                    <XCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        Yêu cầu này đã bị hủy.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>

                    {/* Tenant Contact */}
                    {request.tenant?.user && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Liên hệ khách thuê</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Họ tên</p>
                                    <p className="font-medium">{request.tenant.user.fullName}</p>
                                </div>
                                {request.tenant.user.email && (
                                    <div>
                                        <p className="text-muted-foreground">Email</p>
                                        <p className="font-medium">{request.tenant.user.email}</p>
                                    </div>
                                )}
                                {request.tenant.user.phoneNumber && (
                                    <div>
                                        <p className="text-muted-foreground">Điện thoại</p>
                                        <p className="font-medium">{request.tenant.user.phoneNumber}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
