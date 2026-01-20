import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { servicesApi, Service } from '@/features/services/api/services-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/tax-helpers';

interface ServiceConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    propertyId: string;
    propertyName: string;
}

export const ServiceConfigModal = ({ isOpen, onClose, propertyId, propertyName }: ServiceConfigModalProps) => {
    const queryClient = useQueryClient();
    // Local state for editing prices: { serviceId: newPrice }
    const [edits, setEdits] = useState<Record<string, number>>({});

    // 2. Fetch services for selected property ? 
    // Actually properties from contracts relation ALREADY include services.
    // contracts.room.property.services
    // But that data might be stale if we edit it.
    // Better to fetch services fresh.
    const { data: servicesData, isLoading: isLoadingServices } = useQuery({
        queryKey: ['services', propertyId],
        queryFn: () => servicesApi.getServices({ propertyId, limit: 100 }),
        enabled: !!propertyId && isOpen,
    });

    const services = servicesData?.data || [];

    const updateServiceMutation = useMutation({
        mutationFn: ({ id, price }: { id: string; price: number }) =>
            servicesApi.updateService(id, { unitPrice: price }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['services'] });
            queryClient.invalidateQueries({ queryKey: ['contracts'] }); // Update parent table too
            toast.success('Đã cập nhật giá dịch vụ');
            setEdits({});
        },
        onError: () => toast.error('Lỗi cập nhật giá')
    });

    const handleSave = (id: string) => {
        const newPrice = edits[id];
        if (newPrice !== undefined) {
            updateServiceMutation.mutate({ id, price: newPrice });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Cấu Hình Đơn Giá - {propertyName}</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-4 min-h-[300px]">
                    <div className="border rounded-md p-4">
                        {isLoadingServices ? (
                            <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid grid-cols-12 gap-4 font-medium text-sm text-muted-foreground mb-2 px-2">
                                    <div className="col-span-4">Tên dịch vụ</div>
                                    <div className="col-span-3 text-right">Giá hiện tại</div>
                                    <div className="col-span-3">Giá mới</div>
                                    <div className="col-span-2 text-center">Tác vụ</div>
                                </div>

                                {services.map((s: Service) => {
                                    const isEditing = edits[s.id] !== undefined;
                                    return (
                                        <div key={s.id} className="grid grid-cols-12 gap-4 items-center p-2 rounded hover:bg-muted/50 transition-colors">
                                            <div className="col-span-4 font-medium flex flex-col">
                                                <span>{s.serviceName}</span>
                                                <span className="text-xs text-muted-foreground">{s.billingMethod === 'METERED' ? 'Theo chỉ số' : 'Cố định/tháng'}</span>
                                            </div>
                                            <div className="col-span-3 text-right font-mono">
                                                {formatCurrency(s.unitPrice)}/{s.unit || 'tháng'}
                                            </div>
                                            <div className="col-span-3">
                                                <Input
                                                    type="number"
                                                    value={isEditing ? edits[s.id] : ''}
                                                    placeholder="Nhập giá mới"
                                                    onChange={(e) => setEdits(prev => ({ ...prev, [s.id]: Number(e.target.value) }))}
                                                    className="h-8"
                                                />
                                            </div>
                                            <div className="col-span-2 flex justify-center">
                                                {isEditing && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleSave(s.id)}
                                                        disabled={updateServiceMutation.isPending}
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        <Save className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                {services.length === 0 && (
                                    <div className="text-center text-muted-foreground py-8">Chưa có dịch vụ nào cho bất động sản này</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Đóng</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
