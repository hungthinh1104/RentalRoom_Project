import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/tax-helpers'; // Ensure this path is correct based on previous steps
import { Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface InvoicePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isSubmitting: boolean;
    data: {
        contract: {
            id: string;
            monthlyRent: number;
            room?: {
                roomNumber?: string;
                property?: {
                    services?: Array<{
                        id: string;
                        serviceName?: string;
                        billingMethod?: string;
                        unitPrice?: number;
                        unit?: string;
                    }>;
                };
            };
            tenant?: {
                user?: {
                    fullName?: string;
                };
            };
        };
        month: string;
        readings: Record<string, { old: string | number; new: string | number }>;
        selectedServices: string[];
    } | null;
}

export const InvoicePreviewModal = ({
    isOpen,
    onClose,
    onConfirm,
    isSubmitting,
    data
}: InvoicePreviewModalProps) => {
    if (!data || !data.contract) return null;

    const { contract, month, readings, selectedServices } = data;
    const services = contract.room?.property?.services || [];

    // --- Calculate Line Items ---
    const lineItems: Array<{ name: string; description: string; quantity: number; price: number; amount: number }> = [];
    let totalAmount = 0;

    // 1. Rent
    const rentAmount = Number(contract.monthlyRent);
    lineItems.push({
        name: 'Tiền thuê phòng',
        description: `Tháng ${month}`,
        quantity: 1,
        price: rentAmount,
        amount: rentAmount
    });
    totalAmount += rentAmount;

    // 2. Metered Services (Elec/Water)
    const meteredServices = services.filter((s) => s.billingMethod === 'METERED');
    meteredServices.forEach((s) => {
        const r = readings[s.id];
        if (r?.new && r?.old) {
            const usage = Number(r.new) - Number(r.old);
            const price = Number(s.unitPrice);
            const amount = usage * price;
            if (amount > 0) {
                lineItems.push({
                    name: s.serviceName || 'Dịch vụ',
                    description: `${r.new} - ${r.old} = ${usage} ${s.unit || ''}`,
                    quantity: usage,
                    price: price,
                    amount: amount
                });
                totalAmount += amount;
            }
        }
    });

    // 3. Fixed Services
    const fixedServices = services.filter((s) => s.billingMethod === 'FIXED');
    fixedServices.forEach((s) => {
        // Check if selected (if UI supports selection, otherwise assume all for now based on previous logic)
        // The passed `selectedServices` array contains IDs of selected fixed services
        if (selectedServices.includes(s.id)) {
            const price = Number(s.unitPrice);
            lineItems.push({
                name: s.serviceName || 'Dịch vụ',
                description: 'Phí cố định',
                quantity: 1,
                price: price,
                amount: price
            });
            totalAmount += price;
        }
    });

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Xác Nhận Hóa Đơn - {contract.room?.roomNumber}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-muted-foreground">Khách thuê:</span> <span className="font-medium">{contract.tenant?.user?.fullName}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Kỳ hóa đơn:</span> <span className="font-medium">{month}</span>
                        </div>
                    </div>

                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Khoản thu</TableHead>
                                    <TableHead>Chi tiết</TableHead>
                                    <TableHead className="text-right">Đơn giá</TableHead>
                                    <TableHead className="text-right">Thành tiền</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {lineItems.map((item, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell className="font-medium">{item.name}</TableCell>
                                        <TableCell className="text-muted-foreground text-xs">{item.description}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                                        <TableCell className="text-right font-bold">{formatCurrency(item.amount)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex justify-end items-center gap-2 pt-2 border-t">
                        <span className="text-lg font-semibold">Tổng cộng:</span>
                        <span className="text-2xl font-bold text-primary">{formatCurrency(totalAmount)}</span>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Hủy bỏ</Button>
                    <Button onClick={onConfirm} disabled={isSubmitting} className="gap-2">
                        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                        Xác nhận tạo
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
