"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { addMonths, format } from 'date-fns';
import { CalendarIcon, TrendingUp } from 'lucide-react';

interface RenewalDialogProps {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    onConfirm: (data: { newEndDate: string; newRentPrice?: number; increasePercentage?: number }) => void;
    loading?: boolean;
    currentRent: number;
    currentEndDate: string;
}

export function RenewalDialog({
    open,
    onOpenChange,
    onConfirm,
    loading,
    currentRent,
    currentEndDate,
}: RenewalDialogProps) {
    const [durationMonths, setDurationMonths] = useState(6);
    const [increasePercentage, setIncreasePercentage] = useState(0);
    const [customPrice, setCustomPrice] = useState<number | undefined>(undefined);

    // Derived values
    const newEndDate = currentEndDate ? addMonths(new Date(currentEndDate), durationMonths) : addMonths(new Date(), durationMonths);
    const calculatedPrice = customPrice !== undefined ? customPrice : currentRent * (1 + increasePercentage / 100);

    const handleConfirm = () => {
        onConfirm({
            newEndDate: newEndDate.toISOString(),
            newRentPrice: calculatedPrice,
            increasePercentage,
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        Tái ký hợp đồng (Gia hạn)
                    </DialogTitle>
                    <DialogDescription>
                        Tạo hợp đồng mới nối tiếp hợp đồng hiện tại.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-4">
                    {/* Duration Selection */}
                    <div className="space-y-2">
                        <Label>Thời hạn gia hạn</Label>
                        <div className="grid grid-cols-3 gap-2">
                            {[6, 12, 24].map((m) => (
                                <Button
                                    key={m}
                                    variant={durationMonths === m ? "default" : "outline"}
                                    onClick={() => setDurationMonths(m)}
                                    size="sm"
                                    type="button"
                                >
                                    {m} Tháng
                                </Button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2 bg-muted/50 p-2 rounded">
                            <CalendarIcon className="w-4 h-4" />
                            Kết thúc mới: <span className="font-medium text-foreground">{format(newEndDate, 'dd/MM/yyyy')}</span>
                        </div>
                    </div>

                    {/* Price Adjustment */}
                    <div className="space-y-3 border-t pt-4">
                        <Label>Điều chỉnh giá thuê</Label>

                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <Label className="text-xs text-muted-foreground mb-1.5 block">Tăng giá (%)</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        min="0"
                                        max="50"
                                        value={increasePercentage}
                                        onChange={(e) => {
                                            setIncreasePercentage(Number(e.target.value));
                                            setCustomPrice(undefined); // Reset custom override if % changes
                                        }}
                                    />
                                    <span className="text-sm font-medium">%</span>
                                </div>
                            </div>

                            <div className="flex-1">
                                <Label className="text-xs text-muted-foreground mb-1.5 block">Giá mới (VNĐ)</Label>
                                <Input
                                    type="number"
                                    value={calculatedPrice}
                                    onChange={(e) => {
                                        setCustomPrice(Number(e.target.value));
                                        // Reset % if manual price entered (optional, or calculate it back)
                                    }}
                                    className="font-medium"
                                />
                            </div>
                        </div>

                        <div className="text-sm text-muted-foreground">
                            Giá cũ: {currentRent.toLocaleString('vi-VN')} đ <br />
                            Chênh lệch: <span className={calculatedPrice > currentRent ? "text-green-600" : ""}>
                                {calculatedPrice > currentRent ? "+" : ""}
                                {(calculatedPrice - currentRent).toLocaleString('vi-VN')} đ
                            </span>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Hủy
                    </Button>
                    <Button onClick={handleConfirm} disabled={loading}>
                        {loading ? "Đang xử lý..." : "Xác nhận gia hạn"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
