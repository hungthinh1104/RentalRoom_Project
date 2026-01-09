'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    CreateIncomeModal,
    IncomeTable,
    TaxHealthWidget,
    WarningBanner,
    TaxYearClosing
} from '@/features/tax/components';
import { Plus, Filter } from 'lucide-react';
import { roomsApi } from '@/features/rooms/api/rooms-api';

export default function IncomeManagerPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState<number | undefined>(undefined);

    // Fetch rooms with tenants
    const { data: roomsData, isLoading: isLoadingRooms, error: roomsError } = useQuery({
        queryKey: ['rooms'],
        queryFn: async () => {
            const response = await roomsApi.getAll({ limit: 100 });
            return response?.data || [];
        },
    });

    // Transform rooms to rental units with tenants
    const rentalUnits = useMemo(() => {
        return (roomsData || []).map((room: any) => ({
            id: room.id,
            name: `${room.property?.name || 'Property'} - Phòng ${room.roomNumber}`,
            tenants: room.contracts?.filter((c: any) => c.status === 'ACTIVE').map((c: any) => ({
                id: c.tenant?.id || c.tenantId,
                name: c.tenant?.fullName || c.tenant?.email || 'Unknown',
            })) || [],
        }));
    }, [roomsData]);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Quản Lý Doanh Thu</h1>
                    <p className="text-sm text-muted-foreground mt-1">Tracking doanh thu & tính thuế thu nhập cá nhân</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover font-semibold transition-colors h-11"
                >
                    <Plus className="h-4 w-4" />
                    Ghi nhận thu
                </button>
            </div>

            <WarningBanner />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-card p-5 rounded-xl border-2 border-border flex items-center gap-4">
                        <Filter className="h-5 w-5 text-muted-foreground" />
                        <select
                            value={year}
                            onChange={(e) => setYear(Number(e.target.value))}
                            className="border-input rounded-md text-sm bg-input-background text-foreground"
                        >
                            {[2026, 2025, 2024].map(y => <option key={y} value={y}>Năm {y}</option>)}
                        </select>
                        <select
                            value={month || ''}
                            onChange={(e) => setMonth(e.target.value ? Number(e.target.value) : undefined)}
                            className="border-input rounded-md text-sm bg-input-background text-foreground"
                        >
                            <option value="">Cả năm</option>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                <option key={m} value={m}>Tháng {m}</option>
                            ))}
                        </select>
                    </div>

                    <IncomeTable year={year} month={month} />
                </div>

                <div className="space-y-6">
                    <TaxHealthWidget />

                    <TaxYearClosing year={year} />

                    <div className="bg-info-light p-4 rounded-xl border border-info/20">
                        <h3 className="font-semibold text-info-foreground mb-2">💡 Mẹo quản lý thuế</h3>
                        <ul className="text-sm text-info-foreground/80 space-y-2 list-disc pl-4">
                            <li>Luôn cập nhật doanh thu ngay khi nhận tiền.</li>
                            <li>Kiểm tra ngưỡng 100tr/năm thường xuyên.</li>
                            <li>Lưu lại chứng từ (ảnh chụp) cho các khoản chi.</li>
                        </ul>
                    </div>
                </div>
            </div>

            <CreateIncomeModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                rentalUnits={rentalUnits}
            />
        </div>
    );
}
