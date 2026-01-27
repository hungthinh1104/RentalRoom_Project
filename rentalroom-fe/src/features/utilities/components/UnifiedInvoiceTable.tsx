import { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { contractsApi } from '@/features/contracts/api/contracts-api';
import { utilitiesApi, Invoice } from '@/features/utilities/api/utilities-api';
import { calculateInvoiceEstimate } from '@/features/utilities/utils/invoice-helpers';
import { InvoicePreviewModal } from './InvoicePreviewModal';
import { ServiceConfigModal } from './ServiceConfigModal';
import { InvoiceDetailDialog } from './InvoiceDetailDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/utils/tax-helpers';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSecureAction } from '@/hooks/use-secure-action';
import { useLegalConfirmation } from '@/components/security/legal-finality-dialog';

interface ServiceStub {
    id: string;
    serviceName?: string;
    serviceType?: string;
    billingMethod?: string;
    unitPrice?: number;
    unit?: string;
}

export const UnifiedInvoiceTable = () => {
    const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
    const [year, setYear] = useState<number>(new Date().getFullYear());
    const queryClient = useQueryClient();

    // Fetch contracts
    const { data: contractsData, isLoading } = useQuery({
        queryKey: ['contracts', 'active'],
        queryFn: () => contractsApi.getContracts({ status: 'ACTIVE' }),
    });

    // Fetch existing invoices for the selected month
    const { data: existingInvoices = [] } = useQuery({
        queryKey: ['utility-invoices', month, year],
        queryFn: () => {
            const monthStr = `${year}-${month.toString().padStart(2, '0')}`;
            return utilitiesApi.getUtilityInvoices(monthStr);
        },
    });

    const contracts = useMemo(() => contractsData?.data || [], [contractsData?.data]);

    // Local state for readings and selection
    // Key: contractId
    const [readings, setReadings] = useState<Record<string, Record<string, { old: string; new: string }>>>({});
    const [selectedServices, setSelectedServices] = useState<Record<string, string[]>>({});
    const [processing, setProcessing] = useState<string | null>(null); // contractId being processed

    // Helper to init state
    useEffect(() => {
        if (contracts.length > 0) {
            const initialReadings: Record<string, Record<string, { old: string; new: string }>> = {};
            const initialSelected: Record<string, string[]> = {};

            contracts.forEach((c: { id: string; room?: { property?: { services?: Array<{ id: string; billingMethod: string }> } } }) => {
                // Init readings for metered services
                // Ideally we fetch previous readings... simpler version: manual input
                // Fetch last readings? That's heavy.
                // We'll trust user input or they can just input numbers.

                // Init selected fixed services (default all)
                if (c.room?.property?.services) {
                    const fixedIds = c.room.property.services
                        .filter((s) => s.billingMethod === 'FIXED')
                        .map((s) => s.id);
                    initialSelected[c.id] = fixedIds;
                }
            });
            // Merge to preserve user edits if re-render
            setReadings(prev => ({ ...initialReadings, ...prev }));
            setSelectedServices(prev => ({ ...initialSelected, ...prev }));
        }
    }, [contracts]);

    const handleReadingChange = (contractId: string, serviceId: string, type: 'old' | 'new', value: string) => {
        setReadings(prev => ({
            ...prev,
            [contractId]: {
                ...prev[contractId],
                [serviceId]: {
                    ...prev[contractId]?.[serviceId],
                    [type]: value
                }
            }
        }));
    };

    const handleServiceToggle = (contractId: string, serviceId: string) => {
        setSelectedServices(prev => {
            const current = prev[contractId] || [];
            const isSelected = current.includes(serviceId);
            return {
                ...prev,
                [contractId]: isSelected
                    ? current.filter(id => id !== serviceId)
                    : [...current, serviceId]
            };
        });
    };

    const [previewData, setPreviewData] = useState<{
        contract: {
            id: string;
            monthlyRent: number;
            room?: { roomNumber?: string; property?: { services?: Array<{ id: string; billingMethod?: string; serviceType?: string; unitPrice?: number; serviceName?: string }> } };
            tenant?: { user?: { fullName?: string } };
        };
        month: string;
        readings: Record<string, { old: string; new: string }>;
        selectedServices: string[];
    } | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const handleCreateClick = (contract: { id: string; monthlyRent: number; room?: { roomNumber?: string; property?: { services?: Array<{ id: string; billingMethod?: string; serviceType?: string; unitPrice?: number; serviceName?: string }> } }; tenant?: { user?: { fullName?: string } } }) => {
        const contractReadings = readings[contract.id] || {};

        // Prepare readings payload structure for preview
        setPreviewData({
            contract,
            month: `${month}/${year}`,
            readings: contractReadings,
            selectedServices: selectedServices[contract.id] || []
        });
        setIsPreviewOpen(true);
    };

    // 🔒 SECURITY: Legal confirmation for invoice generation
    const { confirm: confirmGenerate, Dialog: GenerateDialog } = useLegalConfirmation();

    const handleConfirmCreate = async () => {
        if (!previewData) return;

        const data = previewData as {
            contract: {
                id: string;
                room?: {
                    roomNumber?: string;
                    property?: {
                        services?: Array<{ id: string; billingMethod?: string; serviceType?: string; unitPrice?: number; serviceName?: string }>
                    }
                }
            };
            readings: Record<string, { new: string }>;
            selectedServices: string[]
        };

        // 🔒 SECURITY: Check if invoice already exists
        const formattedMonth = `${year}-${month.toString().padStart(2, '0')}`;
        const existingInvoice = existingInvoices?.find((inv: Invoice) => inv.contractId === data.contract.id);

        if (existingInvoice) {
            toast.error(`Hóa đơn tháng ${month}/${year} đã tồn tại cho phòng ${data.contract.room?.roomNumber}`);
            setIsPreviewOpen(false);
            return;
        }

        // 🔒 SECURITY: Show legal confirmation
        confirmGenerate({
            title: "Tạo hóa đơn tiện ích",
            description: `Bạn sắp tạo hóa đơn cho phòng ${data.contract.room?.roomNumber} tháng ${month}/${year}. Hành động này sẽ tạo snapshot tài chính và không thể hoàn tác.`,
            severity: "legal",
            consentText: "Tôi xác nhận tạo hóa đơn này",
        }, async () => {
            try {
                setProcessing(data.contract.id);
                const { contract, readings: contractReadings } = data;

                // Prepare metered readings payload
                const readingsPayload: Array<{ serviceId: string; currentReading: number }> = [];
                const meteredServices = contract.room?.property?.services?.filter((s: { billingMethod?: string }) => s.billingMethod === 'METERED') || [];

                for (const s of meteredServices) {
                    const r = contractReadings[s.id];
                    if (r?.new) {
                        readingsPayload.push({
                            serviceId: s.id,
                            currentReading: Number(r.new)
                        });
                    }
                }

                await utilitiesApi.generateUtilityInvoice(contract.id, formattedMonth, {
                    readings: readingsPayload,
                    includeRent: true,
                    includeFixedServices: true
                });

                // Invalidate and refetch invoice list
                queryClient.invalidateQueries({ queryKey: ['utility-invoices', month, year] });

                toast.success(`Đã tạo hóa đơn cho phòng ${contract.room?.roomNumber}`);
                setIsPreviewOpen(false);
                setPreviewData(null);
            } catch (error: unknown) {
                console.error('[Invoice Creation Error]', error);

                let errorMessage = 'Lỗi tạo hóa đơn';

                if (error && typeof error === 'object') {
                    let message: string | undefined;

                    if ('message' in error && typeof error.message === 'string') {
                        message = error.message;
                    } else if ('response' in error) {
                        const apiError = error as { response?: { data?: { message?: string } } };
                        message = apiError.response?.data?.message;
                    }

                    if (message) {
                        if (message.includes('Invoice already exists')) {
                            errorMessage = `Hóa đơn tháng ${month}/${year} đã tồn tại. Vui lòng kiểm tra lại.`;
                        } else if (message.includes('Contract not found')) {
                            errorMessage = 'Không tìm thấy hợp đồng';
                        } else if (message.includes('Invalid readings')) {
                            errorMessage = 'Số đọc không hợp lệ';
                        } else {
                            errorMessage = message;
                        }
                    }
                }

                toast.error(errorMessage);
            } finally {
                setProcessing(null);
            }
        });
    };

    // Extract unique properties
    const properties = useMemo(() => {
        const uniqueProperties = new Map();
        contracts.forEach((c: { room?: { property?: { id?: string } } }) => {
            const p = c.room?.property;
            if (p && p.id) {
                uniqueProperties.set(p.id, p);
            }
        });
        return Array.from(uniqueProperties.values());
    }, [contracts]);

    // Default active property
    // Default active property logic
    const [activePropertyId, setActivePropertyId] = useState<string>('');

    // Ensure activePropertyId is valid
    useEffect(() => {
        if (properties.length > 0) {
            // If no active property user-selected yet, or current selection is invalid
            if (!activePropertyId || !properties.find(p => p.id === activePropertyId)) {
                setActivePropertyId(properties[0].id);
            }
        }
    }, [properties, activePropertyId]);

    // Derived active ID to use for filtering (fallback to first property if state not yet updated)
    const effectivePropertyId = activePropertyId || properties[0]?.id || '';

    // Filter contracts
    const activeProperty = properties.find((p: { id: string }) => p.id === effectivePropertyId);
    const filteredContracts = contracts.filter((c: { room?: { property?: { id?: string } } }) => c.room?.property?.id === effectivePropertyId);

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-semibold">Tạo Hóa Đơn Tháng</h2>
                    <Input
                        type="number"
                        value={month}
                        onChange={e => setMonth(Number(e.target.value))}
                        className="w-20"
                        min={1} max={12}
                    />
                    <Input
                        type="number"
                        value={year}
                        onChange={e => setYear(Number(e.target.value))}
                        className="w-24"
                    />
                </div>
            </div>

            {properties.length > 0 ? (
                <Tabs value={effectivePropertyId} onValueChange={setActivePropertyId} className="w-full">
                    <div className="flex items-center justify-between mb-4">
                        <TabsList className="justify-start overflow-x-auto max-w-[800px]">
                            {properties.map((p: { id: string; name: string }) => (
                                <TabsTrigger key={p.id} value={p.id}>{p.name}</TabsTrigger>
                            ))}
                        </TabsList>

                        {activeProperty && (
                            <Button variant="outline" onClick={() => setIsConfigOpen(true)}>
                                Cấu hình giá {activeProperty.name}
                            </Button>
                        )}
                    </div>

                    <div className="border rounded-lg overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[150px]">Phòng / Khách</TableHead>
                                    <TableHead className="w-[120px]">Tiền Thuê</TableHead>
                                    <TableHead>Điện </TableHead>
                                    <TableHead>Nước</TableHead>
                                    <TableHead>Dịch vụ</TableHead>
                                    <TableHead className="text-right">Tạm tính</TableHead>
                                    <TableHead className="w-[120px] text-right">Hành động</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredContracts.map((contract: { id: string; monthlyRent: number; room?: { roomNumber?: string; property?: { services?: Array<{ id: string; serviceType?: string; billingMethod?: string; unitPrice?: number; serviceName?: string }> } }; tenant?: { user?: { fullName?: string } } }) => {
                                    const services = contract.room?.property?.services || [];
                                    const elec = services.find((s) => s.serviceType === 'ELECTRICITY');
                                    const water = services.find((s) => s.serviceType === 'WATER');
                                    const fixed = services.filter((s) => s.billingMethod === 'FIXED');

                                    // Calculate estimated total
                                    // Calculate estimated total
                                    const calculateEstimate = () => {
                                        return calculateInvoiceEstimate({
                                            monthlyRent: contract.monthlyRent,
                                            readings: readings[contract.id] || {},
                                            selectedServices: selectedServices[contract.id] || [],
                                            services: contract.room?.property?.services || []
                                        });
                                    };

                                    return (
                                        <TableRow key={contract.id}>
                                            <TableCell>
                                                <div className="font-bold">{contract.room?.roomNumber}</div>
                                                <div className="text-xs text-muted-foreground">{contract.tenant?.user?.fullName}</div>
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {formatCurrency(Number(contract.monthlyRent))}
                                            </TableCell>
                                            <TableCell>
                                                {elec ? (
                                                    <div className="space-y-1">
                                                        <div className="flex gap-2 text-xs">
                                                            <Input
                                                                placeholder="Cũ"
                                                                className="h-7 w-16 px-1"
                                                                value={readings[contract.id]?.[elec.id]?.old || ''}
                                                                onChange={(e) => handleReadingChange(contract.id, elec.id, 'old', e.target.value)}
                                                            />
                                                            <Input
                                                                placeholder="Mới"
                                                                className="h-7 w-16 px-1 border-primary/50"
                                                                value={readings[contract.id]?.[elec.id]?.new || ''}
                                                                onChange={(e) => handleReadingChange(contract.id, elec.id, 'new', e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                ) : '-'}
                                            </TableCell>
                                            <TableCell>
                                                {water ? (
                                                    <div className="space-y-1">
                                                        <div className="flex gap-2 text-xs">
                                                            <Input
                                                                placeholder="Cũ"
                                                                className="h-7 w-16 px-1"
                                                                value={readings[contract.id]?.[water.id]?.old || ''}
                                                                onChange={(e) => handleReadingChange(contract.id, water.id, 'old', e.target.value)}
                                                            />
                                                            <Input
                                                                placeholder="Mới"
                                                                className="h-7 w-16 px-1 border-primary/50"
                                                                value={readings[contract.id]?.[water.id]?.new || ''}
                                                                onChange={(e) => handleReadingChange(contract.id, water.id, 'new', e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                ) : '-'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    {fixed.map((s: ServiceStub) => (
                                                        <div key={s.id} className="flex items-center gap-2 text-xs">
                                                            <Checkbox
                                                                checked={selectedServices[contract.id]?.includes(s.id)}
                                                                onCheckedChange={() => handleServiceToggle(contract.id, s.id)}
                                                            />
                                                            <span>{s.serviceName}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-primary">
                                                {formatCurrency(calculateEstimate())}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {(() => {
                                                    const existingInvoice = existingInvoices?.find((inv: Invoice) => inv.contractId === contract.id);

                                                    if (existingInvoice) {
                                                        return (
                                                            <div className="text-xs text-muted-foreground">
                                                                <span className="text-success font-semibold">✓ Đã tạo</span>
                                                            </div>
                                                        );
                                                    }

                                                    return (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleCreateClick(contract)}
                                                            disabled={processing === contract.id}
                                                        >
                                                            {processing === contract.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Tạo HĐ'}
                                                        </Button>
                                                    );
                                                })()}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </Tabs>
            ) : (
                <div className="text-center py-8 text-muted-foreground">Không có hợp đồng nào đang hoạt động</div>
            )}

            {/* Invoice History Section */}
            {existingInvoices && existingInvoices.length > 0 && (
                <div className="mt-8 space-y-4">
                    <h3 className="text-lg font-semibold">Lịch sử hóa đơn - Tháng {month}/{year}</h3>
                    <div className="border rounded-lg overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Phòng / Khách</TableHead>
                                    <TableHead>Tổng tiền</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead>Ngày tạo</TableHead>
                                    <TableHead className="text-right">Hành động</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {existingInvoices.map((invoice: Invoice) => {
                                    const contract = contracts.find((c: { id: string }) => c.id === invoice.contractId);
                                    return (
                                        <TableRow key={invoice.id}>
                                            <TableCell>
                                                <div className="font-bold">{contract?.room?.roomNumber}</div>
                                                <div className="text-xs text-muted-foreground">{contract?.tenant?.user?.fullName}</div>
                                            </TableCell>
                                            <TableCell className="font-semibold">
                                                {formatCurrency(Number(invoice.totalAmount) || 0)}
                                            </TableCell>
                                            <TableCell>
                                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${invoice.status === 'PAID' ? 'bg-success/10 text-success' :
                                                    invoice.status === 'OVERDUE' ? 'bg-destructive/10 text-destructive' :
                                                        'bg-warning/10 text-warning'
                                                    }`}>
                                                    {invoice.status === 'PAID' ? 'Đã thanh toán' :
                                                        invoice.status === 'OVERDUE' ? 'Quá hạn' :
                                                            'Chưa thanh toán'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {new Date(invoice.createdAt).toLocaleDateString('vi-VN')}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setSelectedInvoiceId(invoice.id);
                                                        setIsDetailOpen(true);
                                                    }}
                                                >
                                                    Xem
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}

            <InvoicePreviewModal
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                onConfirm={handleConfirmCreate}
                isSubmitting={!!processing}
                data={previewData}
            />

            {activeProperty && (
                <ServiceConfigModal
                    isOpen={isConfigOpen}
                    onClose={() => setIsConfigOpen(false)}
                    propertyId={activeProperty.id}
                    propertyName={activeProperty.name}
                />
            )}

            <InvoiceDetailDialog
                invoiceId={selectedInvoiceId}
                open={isDetailOpen}
                onOpenChange={setIsDetailOpen}
            />

            {/* 🔒 SECURITY: Legal confirmation dialog */}
            <GenerateDialog />
        </div>
    );
};
