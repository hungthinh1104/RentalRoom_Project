'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { taxService } from '@/features/tax/api/tax-api';
import { CreateIncomePayload, IncomeType } from '@/types/tax';
import { getIncomeTypeLabel } from '@/lib/i18n/income-labels';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

interface CreateIncomeModalProps {
    isOpen: boolean;
    onClose: () => void;
    rentalUnits: { id: string; name: string; tenants?: Array<{ id: string; name: string }> }[];
}

export function CreateIncomeModal({ isOpen, onClose, rentalUnits }: CreateIncomeModalProps) {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState<Partial<CreateIncomePayload>>({
        incomeType: IncomeType.RENTAL,
        paymentMethod: 'BANK_TRANSFER',
        receivedAt: new Date().toISOString().split('T')[0],
    });

    const { mutate, isPending } = useMutation({
        mutationFn: taxService.createIncome,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['incomes'] });
            queryClient.invalidateQueries({ queryKey: ['taxProjection'] });
            onClose();
        },
    });

    if (!isOpen) return null;

    const selectedUnit = rentalUnits.find(u => u.id === formData.rentalUnitId);
    const isRentType = formData.incomeType === IncomeType.RENTAL;
    const canSubmit = formData.amount && formData.rentalUnitId && (!isRentType || formData.tenantId);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;

        mutate({
            rentalUnitId: formData.rentalUnitId!,
            tenantId: formData.tenantId,
            amount: Number(formData.amount),
            incomeType: formData.incomeType as IncomeType,
            receivedAt: new Date(formData.receivedAt!).toISOString(),
            paymentMethod: formData.paymentMethod!,
            note: formData.note,
            receiptNumber: formData.receiptNumber,
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[var(--z-modal)] flex items-center justify-center p-4">
            <div className="bg-card rounded-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200 border-2 border-border">
                <h2 className="text-xl font-bold mb-4 text-foreground">Ghi Nhận Thu Nhập Mới</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Căn hộ / Phòng</label>
                        <select
                            className="w-full border border-input rounded-lg p-2 bg-input-background text-foreground"
                            required
                            value={formData.rentalUnitId || ''}
                            onChange={(e) => setFormData({ ...formData, rentalUnitId: e.target.value, tenantId: undefined })}
                        >
                            <option value="">-- Chọn phòng --</option>
                            {rentalUnits.map(u => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Loại thu nhập</label>
                            <select
                                className="w-full border border-input rounded-lg p-2 bg-input-background text-foreground"
                                value={formData.incomeType}
                                onChange={(e) => setFormData({ ...formData, incomeType: e.target.value as IncomeType, tenantId: undefined })}
                            >
                                {Object.values(IncomeType).map(type => (
                                    <option key={type} value={type}>{getIncomeTypeLabel(type)}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Số tiền (VND)</label>
                            <input
                                type="number"
                                className="w-full border border-input rounded-lg p-2 bg-input-background text-foreground"
                                placeholder="0"
                                required
                                min={0}
                                value={formData.amount || ''}
                                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                            />
                        </div>
                    </div>

                    {isRentType && selectedUnit?.tenants && (
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                                Khách thuê <span className="text-destructive">*</span>
                            </label>
                            <select
                                className="w-full border border-input rounded-lg p-2 bg-input-background text-foreground"
                                value={formData.tenantId || ''}
                                onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                                required={isRentType}
                            >
                                <option value="">-- Chọn khách thuê --</option>
                                {selectedUnit.tenants.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Ngày nhận</label>
                        <input
                            type="date"
                            className="w-full border border-input rounded-lg p-2 bg-input-background text-foreground"
                            value={formData.receivedAt}
                            onChange={(e) => setFormData({ ...formData, receivedAt: e.target.value })}
                            required
                        />
                    </div>

                    <div className="bg-info-light p-3 rounded-lg text-sm text-info-foreground border border-info/20">
                        ℹ️ Hệ thống sẽ tự động phân loại thuế dựa trên loại thu nhập bạn chọn.
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 text-muted-foreground hover:bg-muted rounded-lg font-medium"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={isPending || !canSubmit}
                            className={clsx(
                                "flex-1 px-4 py-2 rounded-lg font-medium flex justify-center items-center gap-2 transition-colors",
                                canSubmit
                                    ? "bg-primary hover:bg-primary-hover text-white"
                                    : "bg-muted text-muted-foreground cursor-not-allowed"
                            )}
                        >
                            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                            Lưu
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
