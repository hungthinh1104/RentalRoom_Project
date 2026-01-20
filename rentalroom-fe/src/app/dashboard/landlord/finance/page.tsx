'use client';

import { useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { Coins, History, Zap, Receipt, Plus, FileText, LayoutDashboard, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { contractsApi } from '@/features/contracts/api/contracts-api';
import { roomsApi } from '@/features/rooms/api/rooms-api';
import {
    CreateIncomeModal,
    IncomeTable,
    TaxHealthWidget,
    FinancialDashboard
} from '@/features/tax/components';
import { ExpenseTable, CreateExpenseModal } from '@/features/tax/components';
import { UnifiedInvoiceTable } from '@/features/utilities/components/UnifiedInvoiceTable';
import { reportsApi } from '@/features/reports/api/reports-api';
import { formatCurrency } from '@/utils/tax-helpers';

export default function ThuChiPage() {
    const { data: session } = useSession();
    const [activeTab, setActiveTab] = useState<'overview' | 'create-invoice' | 'history' | 'expenses'>('overview');
    const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

    // History filter states
    const [historyYear, setHistoryYear] = useState(new Date().getFullYear());
    const [historyMonth, setHistoryMonth] = useState<number | undefined>(undefined);

    // Fetch active contracts (not rooms) to get rental units with tenants
    const { data: contractsData, isLoading: isLoadingContracts, error: contractsError } = useQuery({
        queryKey: ['active-contracts'],
        queryFn: async () => {
            const response = await contractsApi.getApplications({ status: 'ACTIVE', limit: 100 });
            return response?.data || [];
        },
    });

    // Transform contracts to rental units with tenants
    const rentalUnits = useMemo(() => {
        return (contractsData || []).map((contract: {
            room?: { id: string; roomNumber: string; property?: { name: string } };
            roomId?: string;
            tenant?: { id: string; user?: { fullName: string }; email?: string };
            tenantId?: string;
        }) => ({
            id: contract.room?.id || contract.roomId,
            name: `${contract.room?.property?.name || 'Property'} - Phòng ${contract.room?.roomNumber}`,
            tenants: [{
                id: contract.tenant?.id || contract.tenantId,
                name: contract.tenant?.user?.fullName || contract.tenant?.email || 'Unknown',
            }],
        }));
    }, [contractsData]);

    const handleAddClick = () => {
        if (activeTab === 'expenses') {
            setIsExpenseModalOpen(true);
        } else {
            // Check if user wants ad-hoc income or just directed to table
            // We'll open modal for ad-hoc income
            setIsIncomeModalOpen(true);
        }
    };

    // Error state
    if (contractsError) {
        return (
            <div className="container mx-auto p-8 max-w-7xl">
                <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                    <div className="p-4 bg-destructive/10 rounded-full mb-4">
                        <svg className="h-12 w-12 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Không thể tải dữ liệu</h3>
                    <p className="text-muted-foreground mb-4">
                        {contractsError?.message || 'Đã xảy ra lỗi khi tải danh sách hợp đồng'}
                    </p>
                    <Button onClick={() => window.location.reload()} variant="outline">
                        Thử lại
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 md:p-6 space-y-8 max-w-7xl animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Coins className="h-8 w-8 text-primary" />
                        </div>
                        Quản Lý Thu Chi
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        Theo dõi dòng tiền, quản lý hóa đơn và chi phí vận hành
                    </p>
                </div>
                {activeTab !== 'create-invoice' && (
                    <Button onClick={handleAddClick} size="lg" className="shadow-lg hover:shadow-xl transition-all">
                        <Plus className="h-5 w-5 mr-2" />
                        Ghi nhận {activeTab === 'expenses' ? 'chi phí' : 'thu nhập'}
                    </Button>
                )}
            </div>

            {/* Main Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'overview' | 'create-invoice' | 'history' | 'expenses')} className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto p-1 bg-muted/50 rounded-xl">
                    <TabsTrigger value="overview" className="h-10 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                        <LayoutDashboard className="h-4 w-4 mr-2" />
                        Tổng quan
                    </TabsTrigger>
                    <TabsTrigger value="create-invoice" className="h-10 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                        <FileText className="h-4 w-4 mr-2" />
                        Hóa Đơn
                    </TabsTrigger>
                    <TabsTrigger value="history" className="h-10 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                        <History className="h-4 w-4 mr-2" />
                        Lịch sử
                    </TabsTrigger>
                    <TabsTrigger value="expenses" className="h-10 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                        <Receipt className="h-4 w-4 mr-2" />
                        Chi Phí
                    </TabsTrigger>
                </TabsList>

                {/* Tab: Overview */}
                <TabsContent value="overview" className="space-y-6 focus-visible:outline-none">
                    <FinancialDashboard />
                </TabsContent>

                {/* Tab: Create Invoice */}
                <TabsContent value="create-invoice" className="space-y-6 focus-visible:outline-none">
                    <Card className="border shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                Bảng Kê Hóa Đơn Tháng
                            </CardTitle>
                            <CardDescription>
                                Tạo và gửi hóa đơn tiền phòng, điện nước cho khách thuê
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 sm:p-6">
                            <UnifiedInvoiceTable />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab: History */}
                <TabsContent value="history" className="space-y-6 focus-visible:outline-none">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card p-4 rounded-xl border shadow-sm">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">Bộ lọc thời gian</h3>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <Select
                                value={historyYear.toString()}
                                onValueChange={(v) => setHistoryYear(Number(v))}
                            >
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue placeholder="Năm" />
                                </SelectTrigger>
                                <SelectContent>
                                    {[2026, 2025, 2024, 2023].map(y => (
                                        <SelectItem key={y} value={y.toString()}>Năm {y}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select
                                value={historyMonth?.toString() || 'all'}
                                onValueChange={(v) => setHistoryMonth(v === 'all' ? undefined : Number(v))}
                            >
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Tháng" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Cả năm</SelectItem>
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                        <SelectItem key={m} value={m.toString()}>Tháng {m}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Card className="border shadow-sm">
                        <CardContent className="p-0 sm:p-6">
                            <IncomeTable year={historyYear} month={historyMonth} />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab: Expenses */}
                <TabsContent value="expenses" className="space-y-6 focus-visible:outline-none">
                    <ExpenseReportSummary year={historyYear} />

                    <div className="bg-card p-4 rounded-xl border shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                                <Receipt className="h-5 w-5 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Chi tiết khoản chi</h3>
                                <p className="text-sm text-muted-foreground">Danh sách các khoản chi tiêu cụ thể</p>
                            </div>
                        </div>
                        <Select
                            value={historyYear.toString()}
                            onValueChange={(v) => setHistoryYear(Number(v))}
                        >
                            <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder="Năm" />
                            </SelectTrigger>
                            <SelectContent>
                                {[2026, 2025, 2024, 2023].map(y => (
                                    <SelectItem key={y} value={y.toString()}>Năm {y}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <ExpenseTable year={historyYear} />
                </TabsContent>
            </Tabs>

            {/* Footer Widget */}
            <div className="mt-8 pt-8 border-t">
                <TaxHealthWidget year={historyYear} />
            </div>

            {/* Modals */}
            <CreateIncomeModal
                isOpen={isIncomeModalOpen}
                onClose={() => setIsIncomeModalOpen(false)}
                rentalUnits={rentalUnits}
            />
            <CreateExpenseModal
                isOpen={isExpenseModalOpen}
                onClose={() => setIsExpenseModalOpen(false)}
                rentalUnits={rentalUnits}
            />
        </div>
    );
}

function ExpenseReportSummary({ year }: { year: number }) {
    const { data: session } = useSession();

    const { data: report, isLoading } = useQuery({
        queryKey: ['landlord-expenses-report', year, session?.user?.id],
        queryFn: async () => {
            if (!session?.user?.id) return null;
            const startDate = `${year}-01-01`;
            const endDate = `${year}-12-31`;
            const res = await reportsApi.getLandlordExpenses({
                landlordId: session.user.id,
                startDate,
                endDate
            });
            return res.data;
        },
        enabled: !!session?.user?.id,
    });

    if (isLoading) {
        return <div className="h-24 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
    }

    if (!report) return null;

    const maintenanceCost = report.breakdown.find((b: { type: string; amount: number }) => b.type === 'MAINTENANCE')?.amount || 0;
    const utilityCost = report.breakdown
        .filter((b: { type: string; amount: number }) => ['ELECTRICITY', 'WATER', 'INTERNET', 'SERVICE'].includes(b.type))
        .reduce((sum: number, b: { type: string; amount: number }) => sum + b.amount, 0);
    const otherCost = report.totalExpenses - maintenanceCost - utilityCost;

    return (
        <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tổng chi phí bảo trì</CardTitle>
                    <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(maintenanceCost)}</div>
                    <p className="text-xs text-muted-foreground">
                        Chi phí sửa chữa, bảo dưỡng phòng
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Chi phí dịch vụ</CardTitle>
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(utilityCost)}</div>
                    <p className="text-xs text-muted-foreground">
                        Điện, nước, internet, vệ sinh
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Chi phí khác</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(otherCost)}</div>
                    <p className="text-xs text-muted-foreground">
                        Thuế, bảo hiểm, chi phí khác
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
