import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { taxService } from '@/features/tax/api/tax-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface CreateExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    rentalUnits: { id: string; name: string }[];
}

const EXPENSE_TYPES = [
    { value: 'REPAIR_MAINTENANCE', label: 'Sửa chữa & Bảo trì' },
    { value: 'MANAGEMENT_FEE', label: 'Phí quản lý' },
    { value: 'UTILITIES_VILLAGE', label: 'Điện nước (Đầu vào)' },
    { value: 'MARKETING', label: 'Quảng cáo & Môi giới' },
    { value: 'TAX_PAYMENT', label: 'Nộp thuế' },
    { value: 'INSURANCE', label: 'Bảo hiểm' },
    { value: 'OTHER', label: 'Khác' },
];

export function CreateExpenseModal({ isOpen, onClose, rentalUnits }: CreateExpenseModalProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        rentalUnitId: '',
        amount: '',
        expenseType: 'REPAIR_MAINTENANCE',
        paidAt: new Date().toISOString().split('T')[0],
        note: '',
        receiptNumber: '',
    });

    const createMutation = useMutation({
        mutationFn: taxService.createExpense,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            toast({
                title: 'Thành công',
                description: 'Đã ghi nhận khoản chi',
            });
            onClose();
            // Reset form
            setFormData({
                rentalUnitId: '',
                amount: '',
                expenseType: 'REPAIR_MAINTENANCE',
                paidAt: new Date().toISOString().split('T')[0],
                note: '',
                receiptNumber: '',
            });
        },
        onError: (error: unknown) => {
            const message = error && typeof error === 'object' && 'response' in error ?
                (error as { response?: { data?: { message?: string } } }).response?.data?.message : undefined;
            toast({
                title: 'Lỗi',
                description: message || 'Không thể tạo khoản chi',
                variant: 'destructive',
            });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.rentalUnitId) {
            toast({
                title: 'Thiếu thông tin',
                description: 'Vui lòng chọn bất động sản',
                variant: 'destructive',
            });
            return;
        }
        if (!formData.amount || Number(formData.amount) <= 0) {
            toast({
                title: 'Thiếu thông tin',
                description: 'Vui lòng nhập số tiền hợp lệ',
                variant: 'destructive',
            });
            return;
        }

        createMutation.mutate({
            ...formData,
            amount: Number(formData.amount),
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Ghi nhận Chi phí mới</DialogTitle>
                    <DialogDescription>
                        Nhập thông tin khoản chi để theo dõi dòng tiền (Lưu ý: Thường không được khấu trừ thuế TNCN).
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="rental-unit">Bất động sản <span className="text-destructive">*</span></Label>
                        <Select
                            value={formData.rentalUnitId}
                            onValueChange={(value) => setFormData({ ...formData, rentalUnitId: value })}
                        >
                            <SelectTrigger id="rental-unit">
                                <SelectValue placeholder="Chọn bất động sản" />
                            </SelectTrigger>
                            <SelectContent>
                                {rentalUnits.map((unit) => (
                                    <SelectItem key={unit.id} value={unit.id}>
                                        {unit.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Số tiền (VND) <span className="text-destructive">*</span></Label>
                            <Input
                                id="amount"
                                type="number"
                                placeholder="0"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="date">Ngày chi <span className="text-destructive">*</span></Label>
                            <Input
                                id="date"
                                type="date"
                                value={formData.paidAt}
                                onChange={(e) => setFormData({ ...formData, paidAt: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="type">Loại chi phí</Label>
                        <Select
                            value={formData.expenseType}
                            onValueChange={(value) => setFormData({ ...formData, expenseType: value })}
                        >
                            <SelectTrigger id="type">
                                <SelectValue placeholder="Chọn loại chi phí" />
                            </SelectTrigger>
                            <SelectContent>
                                {EXPENSE_TYPES.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="receipt">Số hóa đơn / Chứng từ (Tùy chọn)</Label>
                        <Input
                            id="receipt"
                            placeholder="VD: HD-12345"
                            value={formData.receiptNumber}
                            onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="note">Ghi chú</Label>
                        <Textarea
                            id="note"
                            placeholder="Chi tiết về khoản chi..."
                            value={formData.note}
                            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            className="bg-primary hover:bg-primary/90"
                            disabled={createMutation.isPending}
                        >
                            {createMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Lưu khoản chi
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
