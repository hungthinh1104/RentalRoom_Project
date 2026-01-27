'use client';

import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp, TrendingDown, Lock, History } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MeterReadingInputProps {
    /** Previous reading (locked, display only) */
    previousReading: number;
    /** Previous reading date */
    previousDate: string;
    /** Current value (controlled) */
    value: number;
    /** Change handler */
    onChange: (value: number) => void;
    /** Unit label (kWh, m³, etc.) */
    unit: string;
    /** Unit price for calculation */
    unitPrice?: number;
    /** Whether input is disabled */
    disabled?: boolean;
    /** Maximum allowed delta percentage (default 50%) */
    maxDeltaPercent?: number;
    /** Minimum allowed delta (negative = allow decrease) */
    minDelta?: number;
}

/**
 * 🔒 SECURE METER READING INPUT
 *
 * Prevents meter fraud by:
 * 1. Showing locked previous reading
 * 2. Calculating and validating delta
 * 3. Warning on anomalous readings (±50%)
 * 4. Preventing negative delta (usage can't go down)
 * 5. Showing estimated cost
 *
 * FRAUD PREVENTION:
 * - Can't modify previous reading
 * - Visual warning on suspicious values
 * - History comparison visible
 */
export function MeterReadingInput({
    previousReading,
    previousDate,
    value,
    onChange,
    unit,
    unitPrice,
    disabled = false,
    maxDeltaPercent = 50,
    minDelta = 0,
}: MeterReadingInputProps) {
    const delta = value - previousReading;
    const deltaPercent = previousReading > 0 ? (delta / previousReading) * 100 : 0;

    // Detect anomalies
    const anomaly = useMemo(() => {
        if (delta < minDelta) {
            return {
                type: 'critical' as const,
                message: `⚠️ Số mới nhỏ hơn số cũ (${delta} ${unit})`,
            };
        }
        if (Math.abs(deltaPercent) > maxDeltaPercent) {
            return {
                type: 'warning' as const,
                message: `Biến động bất thường: ${deltaPercent > 0 ? '+' : ''}${deltaPercent.toFixed(0)}%`,
            };
        }
        return null;
    }, [delta, deltaPercent, maxDeltaPercent, minDelta, unit]);

    const estimatedCost = unitPrice ? delta * unitPrice : null;

    return (
        <Card className={cn(anomaly?.type === 'critical' && 'border-destructive')}>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                    <History className="h-4 w-4 text-muted-foreground" />
                    Chỉ số công tơ ({unit})
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Previous Reading (Locked) */}
                <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        Chỉ số kỳ trước ({previousDate})
                    </Label>
                    <div className="flex items-center gap-2">
                        <Input
                            type="number"
                            value={previousReading}
                            disabled
                            className="bg-muted font-mono"
                        />
                        <Badge variant="secondary">{unit}</Badge>
                    </div>
                </div>

                {/* Current Reading (Editable) */}
                <div className="space-y-1">
                    <Label className="text-xs">Chỉ số hiện tại</Label>
                    <div className="flex items-center gap-2">
                        <Input
                            type="number"
                            value={value}
                            onChange={(e) => onChange(Number(e.target.value))}
                            disabled={disabled}
                            className={cn(
                                'font-mono',
                                anomaly?.type === 'critical' && 'border-destructive focus:ring-destructive'
                            )}
                            min={previousReading}
                        />
                        <Badge variant="secondary">{unit}</Badge>
                    </div>
                </div>

                {/* Delta Display */}
                <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2">
                        {delta >= 0 ? (
                            <TrendingUp className="h-4 w-4 text-success" />
                        ) : (
                            <TrendingDown className="h-4 w-4 text-destructive" />
                        )}
                        <span className="text-sm font-medium">
                            Tiêu thụ: {delta.toLocaleString('vi-VN')} {unit}
                        </span>
                    </div>
                    {estimatedCost !== null && (
                        <Badge variant="outline">
                            ≈ {estimatedCost.toLocaleString('vi-VN')} VNĐ
                        </Badge>
                    )}
                </div>

                {/* Anomaly Warning */}
                {anomaly && (
                    <div
                        className={cn(
                            'flex items-center gap-2 p-2 rounded text-sm',
                            anomaly.type === 'critical'
                                ? 'bg-destructive/10 text-destructive'
                                : 'bg-warning/10 text-warning'
                        )}
                    >
                        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                        <span>{anomaly.message}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

/**
 * Hook for meter reading validation
 */
export function useMeterValidation(
    previousReading: number,
    currentReading: number,
    maxDeltaPercent = 50
) {
    const delta = currentReading - previousReading;
    const deltaPercent = previousReading > 0 ? (delta / previousReading) * 100 : 0;

    return {
        delta,
        deltaPercent,
        isValid: delta >= 0 && Math.abs(deltaPercent) <= maxDeltaPercent,
        isNegative: delta < 0,
        isAnomalous: Math.abs(deltaPercent) > maxDeltaPercent,
    };
}
