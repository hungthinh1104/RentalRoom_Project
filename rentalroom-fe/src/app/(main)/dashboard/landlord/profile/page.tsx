'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { Building2, DollarSign, FileText, TrendingUp, Skeleton } from 'lucide-react';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { StatsGrid } from '@/components/profile/StatsGrid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api/client';
import { toast as sonnerToast } from 'sonner';

export default function LandlordProfilePage() {
    const { data: session } = useSession();
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: session?.user?.name || '',
        email: session?.user?.email || '',
        phone: session?.user?.phone || '',
        avatar: session?.user?.image || '',
    });

    // Fetch landlord statistics
    const { data: statsData, isLoading: statsLoading } = useQuery({
        queryKey: ['landlord-profile-stats', session?.user?.id],
        queryFn: async () => {
            if (!session?.user?.id) return null;
            try {
                const properties = await api.get('/properties', {
                    params: { landlordId: session.user.id },
                });
                const contracts = await api.get('/contracts', {
                    params: { limit: 1000 },
                });
                const invoices = await api.get('/billing/invoices', {
                    params: { limit: 1000 },
                });

                const propertiesData = (properties.data as any)?.data || properties.data || [];
                const contractsData = (contracts.data as any)?.data || contracts.data || [];
                const invoicesData = (invoices.data as any)?.data || invoices.data || [];

                const propertyCount = Array.isArray(propertiesData) ? propertiesData.length : 0;
                const activeContracts = Array.isArray(contractsData)
                    ? contractsData.filter((c: any) => c.status === 'ACTIVE').length
                    : 0;
                const thisMonthStart = new Date(
                    new Date().getFullYear(),
                    new Date().getMonth(),
                    1,
                );
                const thisMonthRevenue = Array.isArray(invoicesData)
                    ? invoicesData
                        .filter(
                            (inv: any) =>
                                inv.createdAt &&
                                new Date(inv.createdAt) >= thisMonthStart &&
                                inv.status === 'PAID',
                        )
                        .reduce((sum: number, inv: any) => sum + (inv.totalAmount || 0), 0)
                    : 0;

                const occupiedRooms = Array.isArray(contractsData)
                    ? contractsData.filter((c: any) => c.status === 'ACTIVE').length
                    : 0;
                const totalRooms = Array.isArray(propertiesData)
                    ? propertiesData.reduce(
                        (sum: number, p: any) => sum + (p.rooms?.length || 0),
                        0,
                    )
                    : 0;
                const occupancyRate =
                    totalRooms > 0
                        ? Math.round((occupiedRooms / totalRooms) * 100)
                        : 0;

                return {
                    properties: propertyCount,
                    activeContracts,
                    revenue: thisMonthRevenue,
                    occupancy: occupancyRate,
                };
            } catch (error) {
                console.error('Failed to fetch statistics:', error);
                return null;
            }
        },
        enabled: !!session?.user?.id,
    });

    const stats = [
        {
            label: 'Tổng bất động sản',
            value: statsLoading ? '...' : `${statsData?.properties || 0}`,
            icon: Building2,
            color: 'primary' as const,
        },
        {
            label: 'Hợp đồng đang hoạt động',
            value: statsLoading ? '...' : `${statsData?.activeContracts || 0}`,
            icon: FileText,
            color: 'success' as const,
        },
        {
            label: 'Doanh thu tháng này',
            value: statsLoading ? '...' : `${(statsData?.revenue || 0).toLocaleString()} VND`,
            icon: DollarSign,
            color: 'info' as const,
        },
        {
            label: 'Tỷ lệ lấp đầy',
            value: statsLoading ? '...' : `${statsData?.occupancy || 0}%`,
            icon: TrendingUp,
            color: 'warning' as const,
        },
    ];

    const handleSave = async () => {
        try {
            await api.patch(`/landlords/${session?.user?.id}`, {
                fullName: formData.name,
                email: formData.email,
                avatar: formData.avatar,
            });
            sonnerToast.success('Đã cập nhật thông tin cá nhân');
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to update profile:', error);
            sonnerToast.error('Không thể cập nhật thông tin');
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-foreground">Hồ Sơ Cá Nhân</h1>
                <p className="text-muted-foreground mt-1">
                    Quản lý thông tin và thiết lập tài khoản của bạn
                </p>
            </div>

            {/* Stats Overview */}
            <StatsGrid stats={stats} />

            {/* Profile Information */}
            <div className="bg-card border-2 border-border rounded-xl p-8">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-foreground">Thông Tin Cá Nhân</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Cập nhật thông tin để giữ hồ sơ của bạn luôn chính xác
                        </p>
                    </div>
                    <Button
                        variant={isEditing ? 'outline' : 'default'}
                        onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
                        className="h-11 font-semibold"
                    >
                        {isEditing ? 'Lưu thay đổi' : 'Chỉnh sửa'}
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Avatar Section */}
                    <div className="md:col-span-1 flex justify-center md:justify-start">
                        <AvatarUpload
                            currentAvatar={formData.avatar}
                            onUploadComplete={(url) => setFormData({ ...formData, avatar: url })}
                            disabled={!isEditing}
                        />
                    </div>

                    {/* Form Fields */}
                    <div className="md:col-span-2 space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-sm font-semibold">
                                    Họ và tên
                                </Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    disabled={!isEditing}
                                    className="bg-background border-2 h-11"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone" className="text-sm font-semibold">
                                    Số điện thoại
                                </Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    disabled={!isEditing}
                                    className="bg-background border-2 h-11"
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
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                disabled={!isEditing}
                                className="bg-background border-2 h-11"
                            />
                        </div>

                        {/* Verification Status */}
                        <div className="bg-success/10 border-2 border-success/30 rounded-xl p-5 mt-6">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-success flex-shrink-0"></div>
                                <div className="flex-1">
                                    <span className="text-base font-bold text-foreground">
                                        Tài khoản đã xác thực
                                    </span>
                                    <p className="text-sm text-foreground/80 mt-1">
                                        Email và số điện thoại đã được xác nhận
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Business Information */}
            <div className="bg-card border-2 border-border rounded-xl p-8">
                <h2 className="text-2xl font-bold text-foreground mb-6">Thông Tin Kinh Doanh</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                        <Label htmlFor="tax-code" className="text-sm font-semibold">
                            Mã số thuế <span className="text-muted-foreground font-normal">(Tùy chọn)</span>
                        </Label>
                        <Input
                            id="tax-code"
                            placeholder="VD: 0123456789"
                            disabled={!isEditing}
                            className="bg-background border-2 h-11"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="business-name" className="text-sm font-semibold">
                            Tên doanh nghiệp <span className="text-muted-foreground font-normal">(Tùy chọn)</span>
                        </Label>
                        <Input
                            id="business-name"
                            placeholder="VD: Công ty TNHH ABC"
                            disabled={!isEditing}
                            className="bg-background border-2 h-11"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
