'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Shield, Users, Building2, FileText, Activity } from 'lucide-react';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { StatsGrid } from '@/components/profile/StatsGrid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAdminDashboardStats } from '@/features/admin/hooks/use-admin-stats';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api/client';

export default function AdminProfilePage() {
    const { data: session, update: updateSession } = useSession();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        fullName: session?.user?.fullName || session?.user?.name || '',
        email: session?.user?.email || '',
        phoneNumber: '',
    });

    // Fetch admin stats
    const { data: statsData } = useAdminDashboardStats();

    // Fetch current user profile
    const { data: profile } = useQuery({
        queryKey: ['admin-profile', session?.user?.id],
        queryFn: async () => {
            if (!session?.user?.id) return null;
            const { data } = await api.get(`/users/${session.user.id}`);
            return data;
        },
        enabled: !!session?.user?.id,
        onSuccess: (data: any) => {
            if (data) {
                setFormData({
                    fullName: data.fullName || '',
                    email: data.email || '',
                    phoneNumber: data.phoneNumber || '',
                });
            }
        },
    });

    // Update profile mutation
    const updateProfile = useMutation({
        mutationFn: async (data: { fullName?: string; phoneNumber?: string }) => {
            if (!session?.user?.id) throw new Error('No user ID');
            const response = await api.patch(`/users/${session.user.id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-profile'] });
            updateSession();
            toast({
                title: 'Thành công',
                description: 'Đã cập nhật thông tin quản trị viên',
            });
            setIsEditing(false);
        },
        onError: () => {
            toast({
                title: 'Lỗi',
                description: 'Không thể cập nhật thông tin',
                variant: 'destructive',
            });
        },
    });

    const stats = [
        {
            label: 'Tổng người dùng',
            value: statsData?.activeUsers?.toString() || '0',
            icon: Users,
            color: 'primary' as const,
        },
        {
            label: 'Bất động sản',
            value: statsData?.totalProperties?.toString() || '0',
            icon: Building2,
            color: 'success' as const,
        },
        {
            label: 'Hợp đồng',
            value: statsData?.expiringContracts?.toString() || '0',
            icon: FileText,
            color: 'info' as const,
        },
        {
            label: 'Tổng phòng',
            value: statsData?.totalRooms?.toString() || '0',
            icon: Activity,
            color: 'warning' as const,
        },
    ];

    const handleSave = () => {
        updateProfile.mutate({
            fullName: formData.fullName,
            phoneNumber: formData.phoneNumber || undefined,
        });
    };

    return (
        <div className="container mx-auto p-4 md:p-6 space-y-8 max-w-7xl animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Shield className="h-8 w-8 text-primary" />
                        </div>
                        Hồ Sơ Quản Trị Viên
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        Quản lý thông tin tài khoản và quyền hạn hệ thống
                    </p>
                </div>
            </div>

            {/* Stats Overview */}
            <StatsGrid stats={stats} />

            {/* Profile Information */}
            <Card className="border shadow-sm">
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-2xl">
                                <Users className="h-5 w-5 text-primary" />
                                Thông Tin Cá Nhân
                            </CardTitle>
                            <CardDescription className="mt-2">
                                Cập nhật thông tin để giữ hồ sơ của bạn luôn chính xác
                            </CardDescription>
                        </div>
                        <Button
                            variant={isEditing ? 'outline' : 'default'}
                            onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
                            size="lg"
                            disabled={updateProfile.isPending}
                        >
                            {updateProfile.isPending ? 'Đang lưu...' : (isEditing ? 'Lưu thay đổi' : 'Chỉnh sửa')}
                        </Button>
                    </div>
                </CardHeader>

                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Avatar Section */}
                        <div className="md:col-span-1 flex justify-center md:justify-start">
                            <AvatarUpload
                                currentAvatar={profile?.avatar || ''}
                                onUploadComplete={async (url) => {
                                    // Save avatar URL to user profile
                                    try {
                                        await api.patch(`/users/${session?.user?.id}`, { avatar: url });
                                        toast({
                                            title: 'Thành công',
                                            description: 'Đã cập nhật ảnh đại diện',
                                        });
                                        // Refetch profile
                                        window.location.reload();
                                    } catch (error) {
                                        toast({
                                            title: 'Lỗi',
                                            description: 'Không thể lưu ảnh đại diện',
                                            variant: 'destructive',
                                        });
                                    }
                                }}
                                disabled={!isEditing}
                            />
                        </div>

                        {/* Form Fields */}
                        <div className="md:col-span-2 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName" className="text-sm font-semibold">
                                        Họ và tên
                                    </Label>
                                    <Input
                                        id="fullName"
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                        disabled={!isEditing}
                                        className="h-11"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phoneNumber" className="text-sm font-semibold">
                                        Số điện thoại
                                    </Label>
                                    <Input
                                        id="phoneNumber"
                                        type="tel"
                                        value={formData.phoneNumber}
                                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                        disabled={!isEditing}
                                        placeholder="Chưa cập nhật"
                                        className="h-11"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-semibold">
                                    Email
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    disabled
                                    className="h-11 bg-muted"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Email không thể thay đổi
                                </p>
                            </div>

                            {/* Role Badge */}
                            <div className="bg-primary/10 border border-primary/30 rounded-xl p-5 mt-6">
                                <div className="flex items-center gap-3">
                                    <Shield className="h-5 w-5 text-primary flex-shrink-0" />
                                    <div className="flex-1">
                                        <span className="text-base font-bold text-foreground">
                                            Quản Trị Viên Hệ Thống
                                        </span>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Có quyền truy cập đầy đủ vào tất cả chức năng và dữ liệu
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Verification Status */}
                            <div className={`border rounded-xl p-5 ${profile?.emailVerified
                                ? 'bg-success/10 border-success/30'
                                : 'bg-warning/10 border-warning/30'
                                }`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${profile?.emailVerified ? 'bg-success' : 'bg-warning'
                                        }`}></div>
                                    <div className="flex-1">
                                        <span className="text-base font-bold text-foreground">
                                            {profile?.emailVerified ? 'Tài khoản đã xác thực' : 'Chưa xác thực email'}
                                        </span>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {profile?.emailVerified ? 'Email đã được xác nhận' : 'Vui lòng xác nhận email'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* System Information */}
            <Card className="border shadow-sm">
                <CardHeader>
                    <CardTitle className="text-xl">Thông Tin Hệ Thống</CardTitle>
                    <CardDescription>
                        Thông tin về phiên bản và cấu hình hệ thống
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex justify-between py-3 border-b">
                            <span className="text-sm text-muted-foreground">Phiên bản hệ thống</span>
                            <span className="text-sm font-semibold">v2.0.0</span>
                        </div>
                        <div className="flex justify-between py-3 border-b">
                            <span className="text-sm text-muted-foreground">Vai trò</span>
                            <span className="text-sm font-semibold">ADMIN</span>
                        </div>
                        <div className="flex justify-between py-3 border-b">
                            <span className="text-sm text-muted-foreground">Ngày tham gia</span>
                            <span className="text-sm font-semibold">
                                {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                            </span>
                        </div>
                        <div className="flex justify-between py-3 border-b">
                            <span className="text-sm text-muted-foreground">Trạng thái</span>
                            <span className="text-sm font-semibold text-success">Hoạt động</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
