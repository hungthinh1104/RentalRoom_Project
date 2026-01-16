'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taxService } from '@/features/tax/api/tax-api';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Lock, Download, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/utils/tax-helpers';

interface TaxYearClosingProps {
    year: number;
}

export function TaxYearClosing({ year }: TaxYearClosingProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isExporting, setIsExporting] = useState(false);

    // Fetch tax year status
    const { data: taxYearData, isLoading } = useQuery({
        queryKey: ['tax-year', year],
        queryFn: () => taxService.getTaxYearSummary(year),
    });

    // Close tax year mutation
    const closeMutation = useMutation({
        mutationFn: () => taxService.closeTaxYear(year),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tax-year'] });
            queryClient.invalidateQueries({ queryKey: ['incomes'] });
            toast({
                title: '🎉 Đã chốt sổ thành công',
                description: `Dữ liệu thuế năm ${year} đã được đóng băng vĩnh viễn.`,
            });
        },
        onError: (error: unknown) => {
            const message = error && typeof error === 'object' && 'response' in error ?
                (error as { response?: { data?: { message?: string } } }).response?.data?.message : undefined;
            toast({
                title: 'Lỗi',
                description: message || 'Không thể chốt sổ thuế',
                variant: 'destructive',
            });
        },
    });

    const handleExport = async () => {
        try {
            setIsExporting(true);
            const data = await taxService.exportTaxYear(year);

            // Create download link
            const blob = new Blob([data as any], { type: 'text/csv' });
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
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
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
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>⚠️ Chốt sổ thuế năm {year}?</AlertDialogTitle>
                                <AlertDialogDescription className="space-y-2">
                                    <p>Hành động này sẽ:</p>
                                    <ul className="list-disc pl-5 space-y-1 text-foreground">
                                        <li>Đóng băng <strong>vĩnh viễn</strong> tất cả dữ liệu thu/chi năm {year}</li>
                                        <li>Không thể thêm, sửa, xóa bất kỳ giao dịch nào</li>
                                        <li>Tạo snapshot bảo toàn pháp lý</li>
                                    </ul>
                                    <p className="text-destructive font-medium pt-2">
                                        ⚠️ Không thể hoàn tác sau khi chốt!
                                    </p>
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Hủy</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() => closeMutation.mutate()}
                                    className="bg-warning hover:bg-warning-hover text-warning-foreground"
                                >
                                    Xác nhận chốt sổ
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>

            {!canClose && !isClosed && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                    💡 Chỉ có thể chốt sổ các năm đã qua (2025 trở về trước)
                </p>
            )}
        </div>
    );
}
