'use client';

import { useQuery } from '@tanstack/react-query';
import { taxService } from '@/features/tax/api/tax-api';
import { formatCurrency, formatDate, getTaxCategoryColor } from '@/utils/tax-helpers';
import { getIncomeTypeLabel, getTaxCategoryLabel } from '@/lib/i18n/income-labels';
import { Trash2, FileText, Loader2 } from 'lucide-react';
import { Income } from '@/types/tax';
import clsx from 'clsx';

interface IncomeTableProps {
    year: number;
    month?: number;
}

export function IncomeTable({ year, month }: IncomeTableProps) {
    const { data: incomes, isLoading } = useQuery({
        queryKey: ['incomes', year, month],
        queryFn: () => taxService.getIncomeList(year, month),
    });

    const handleDelete = async (id: string) => {
        if (confirm('Bạn có chắc chắn muốn xóa? Hành động này sẽ tạo snapshot INCOME_VOIDED.')) {
            await taxService.deleteIncome(id, 'User deleted from UI');
        }
    };

    if (isLoading) return <div className="p-8 text-center text-muted-foreground"><Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" /> Đang tải dữ liệu...</div>;

    const list: Income[] = Array.isArray(incomes) ? incomes : [];

    if (list.length === 0) {
        return (
            <div className="text-center p-12 bg-muted/50 rounded-xl border border-dashed border-border text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <h3 className="text-foreground font-medium">Chưa có dữ liệu</h3>
                <p className="text-sm">Chưa có khoản thu nào được ghi nhận trong thời gian này.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Ngày nhận</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Loại</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Số tiền</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Phân loại thuế</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Thao tác</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {list.map((income) => (
                        <tr key={income.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                {formatDate(income.receivedAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                                {getIncomeTypeLabel(income.incomeType)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-foreground font-mono">
                                {formatCurrency(income.amount)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={clsx("px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border", getTaxCategoryColor(income.taxCategory))}>
                                    {getTaxCategoryLabel(income.taxCategory)}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                    onClick={() => handleDelete(income.id)}
                                    className="text-muted-foreground hover:text-destructive transition-colors"
                                    title="Xóa khoản thu này"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
