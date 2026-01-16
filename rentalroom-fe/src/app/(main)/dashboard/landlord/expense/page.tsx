'use client';

import { useState } from 'react';
import { useProperties } from '@/features/properties/hooks/use-properties';
import { CreateExpenseModal, ExpenseTable } from '@/features/tax/components';
import { Filter, Receipt } from 'lucide-react';

export default function ExpenseManagerPage() {
    const [year, setYear] = useState(new Date().getFullYear());
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Fetch real properties
    const { properties } = useProperties();
    const rentalUnits = properties?.map((p: any) => ({
        id: p.id,
        name: p.name,
    })) || [];

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Quản Lý Chi Phí</h1>
                    <p className="text-sm text-muted-foreground">Tracking các khoản chi phí vận hành (Điện, Nước, Bảo trì...)</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover font-medium transition-colors shadow-sm"
                >
                    <Receipt className="h-4 w-4" />
                    Ghi nhận chi
                </button>
            </div>

            <div className="bg-warning-light border-l-4 border-warning p-4 rounded-r-md">
                <p className="text-sm text-foreground">
                    <strong>⚠️ LƯU Ý:</strong> Theo luật thuế VN đối với cá nhân cho thuê tài sản, các chi phí này
                    <span className="font-bold underline ml-1">KHÔNG ĐƯỢC TRỪ</span> khi tính thuế 5% + 5%.
                </p>
            </div>

            <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex items-center gap-4 w-fit">
                <Filter className="h-5 w-5 text-muted-foreground" />
                <select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="border-input rounded-md text-sm bg-input-background text-foreground"
                >
                    {[2026, 2025, 2024].map(y => <option key={y} value={y}>Năm {y}</option>)}
                </select>
            </div>

            <ExpenseTable year={year} />

            <CreateExpenseModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                rentalUnits={rentalUnits}
            />
        </div>
    );
}
