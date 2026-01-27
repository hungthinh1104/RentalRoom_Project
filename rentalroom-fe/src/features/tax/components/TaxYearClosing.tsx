'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taxService } from '@/features/tax/api/tax-api';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ApiError } from '@/lib/api/client';
import { TaxYearSummary } from '@/types/tax';
import { Lock, Download, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/utils/tax-helpers';
import { useLegalConfirmation } from '@/components/security/legal-finality-dialog';

interface TaxYearClosingProps {
    year: number;
}

export function TaxYearClosing({ year }: TaxYearClosingProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isExporting, setIsExporting] = useState(false);
    const { confirm, Dialog } = useLegalConfirmation();

    // Fetch tax year status
    const { data: taxYearData, isLoading } = useQuery({
        queryKey: ['tax-year', year],
        queryFn: () => taxService.getTaxYearSummary(year),
    });

    // Close tax year mutation
    const closeMutation = useMutation({
        mutationFn: () => taxService.closeTaxYear(year),
        onSuccess: (result: { snapshotId?: string }) => {
            queryClient.invalidateQueries({ queryKey: ['tax-year'] });
            queryClient.invalidateQueries({ queryKey: ['incomes'] });
            toast({
                title: '🎉 Đã chốt sổ thành công',
                description: result?.snapshotId
                    ? `Snapshot: ${result.snapshotId.substring(0, 8)}... - Dữ liệu đã được đóng băng vĩnh viễn.`
                    : `Dữ liệu thuế năm ${year} đã được đóng băng vĩnh viễn.`,
            });
        },
        onError: (error: unknown) => {
            const apiError = error as ApiError;
            toast({
                title: 'Lỗi',
                description: apiError.message || 'Không thể chốt sổ thuế',
                variant: 'destructive',
            });
        },
    });

    const handleExport = async () => {
        try {
            setIsExporting(true);
            const data = await taxService.exportTaxYear(year);

            // Create download link
            const blob = new Blob([data as string], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `tax-report-${year}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast({
                title: 'Đã xuất file',
                description: `File tax-report-${year}.csv đã được tải xuống`,
            });
        } catch (error) {
            toast({
                title: 'Lỗi',
                description: 'Không thể xuất báo cáo',
                variant: 'destructive',
            });
        } finally {
            setIsExporting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="bg-card rounded-xl border border-border p-6">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            </div>
        );
    }

    const isClosed = taxYearData?.status === 'CLOSED';
    const canClose = year < new Date().getFullYear(); // Only close past years

    return (
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        {isClosed ? <Lock className="h-5 w-5 text-success" /> : <AlertTriangle className="h-5 w-5 text-warning" />}
                        Chốt Sổ Thuế Năm {year}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        {isClosed
                            ? 'Dữ liệu đã được đóng băng và không thể chỉnh sửa'
                            : 'Đóng băng dữ liệu để lưu trữ và báo cáo thuế'}
                    </p>
                </div>

                {isClosed && (
                    <div className="flex items-center gap-2 bg-success-light px-3 py-1.5 rounded-lg">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        <span className="text-sm font-medium text-success-foreground">Đã chốt</span>
                    </div>
                )}
            </div>

            {taxYearData && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Tổng thu nhập chịu thuế</p>
                        <p className="text-lg font-semibold text-foreground font-mono">
                            {formatCurrency(taxYearData.taxableTotal || 0)}
                        </p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Thuế ước tính (10%)</p>
                        <p className="text-lg font-semibold text-warning font-mono">
                            {formatCurrency((taxYearData.taxableTotal || 0) * 0.1)}
                        </p>
                    </div>
                </div>
            )}

            <div className="flex gap-3 pt-4">
                <Button
                    onClick={handleExport}
                    disabled={isExporting}
                    variant="outline"
                    className="flex-1"
                >
                    {isExporting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <Download className="h-4 w-4 mr-2" />
                    )}
                    Xuất CSV
                </Button>

                {!isClosed && (
                    <Button
                        onClick={() => {
                            confirm(
                                {
                                    title: `Chốt sổ thuế năm ${year}`,
                                    description: `Hành động này sẽ đóng băng vĩnh viễn tất cả dữ liệu thu/chi năm ${year}. Không thể thêm, sửa, xóa bất kỳ giao dịch nào sau khi chốt. Snapshot pháp lý sẽ được tạo và lưu trữ.`,
                                    severity: "critical",
                                    consentText: "Tôi xác nhận chốt sổ thuế năm này",
                                },
                                async () => {
                                    await closeMutation.mutateAsync();
                                }
                            );
                        }}
                        disabled={!canClose || closeMutation.isPending}
                        className="flex-1 bg-warning hover:bg-warning-hover text-warning-foreground"
                    >
                        {closeMutation.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Lock className="h-4 w-4 mr-2" />
                        )}
                        Chốt sổ năm {year}
                    </Button>
                )}
            </div>
            <Dialog />

            {!canClose && !isClosed && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                    💡 Chỉ có thể chốt sổ các năm đã qua (2025 trở về trước)
                </p>
            )}
        </div>
    );
}
