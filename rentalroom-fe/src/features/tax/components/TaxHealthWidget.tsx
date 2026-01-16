'use client';

import { useQuery } from '@tanstack/react-query';
import { taxService } from '@/features/tax/api/tax-api';
import { formatCurrency, getWarningLevelColor } from '@/utils/tax-helpers';
import { Loader2, TrendingUp, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import clsx from 'clsx';

interface TaxHealthWidgetProps {
    year?: number;
}

export function TaxHealthWidget({ year }: TaxHealthWidgetProps = {}) {
    const currentYear = year || new Date().getFullYear();

    const { data, isLoading, error } = useQuery({
        queryKey: ['taxProjection', currentYear],
        queryFn: () => taxService.getProjection(currentYear),
        staleTime: 1000 * 60 * 5, // 5 minutes cache
    });

    if (isLoading) {
        return (
            <div className="bg-card p-6 rounded-xl border-2 border-border animate-pulse">
                <div className="h-4 bg-muted rounded w-1/3 mb-4"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
            </div>
        );
    }

    if (error) return null;

    if (!data) return null;

    return (
        <div className="bg-card p-6 rounded-xl border-2 border-border">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-muted-foreground text-sm font-medium">Thuế Thu Nhập {currentYear}</h3>
                    <p className="text-2xl font-bold mt-1 text-foreground">
                        {formatCurrency(data.totalSoFar)}
                    </p>
                    <div className="text-xs text-muted-foreground mt-1">/ {formatCurrency(data.threshold)} (Ngưỡng)</div>
                </div>
                <div className={clsx("p-2 rounded-full", getWarningLevelColor(data.warningLevel))}>
                    <TrendingUp className="h-5 w-5" />
                </div>
            </div>

            <div className="w-full bg-muted rounded-full h-2.5 mb-2">
                <div
                    className={clsx(
                        "h-2.5 rounded-full transition-all duration-500",
                        data.warningLevel === 'DANGER' ? 'bg-destructive' :
                            data.warningLevel === 'WARNING' ? 'bg-warning' : 'bg-success'
                    )}
                    style={{ width: `${Math.min(data.percent, 100)}%` }}
                ></div>
            </div>

            <div className="flex items-center justify-between text-xs mt-3">
                <span className={clsx("font-medium px-2 py-1 rounded-md border", getWarningLevelColor(data.warningLevel))}>
                    {data.message}
                </span>
                <Link href="/landlord/income" className="text-primary hover:underline">
                    Chi tiết →
                </Link>
            </div>
        </div>
    );
}
