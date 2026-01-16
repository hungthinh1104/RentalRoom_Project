'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useMemo, useState } from 'react';
import { UtilityInvoiceCard } from '@/features/utilities/components';
import dynamic from 'next/dynamic';
import { billingApi, Invoice } from '@/features/utilities/api/utilities-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CreditCard, CheckCircle2 } from 'lucide-react';

const UtilityPaymentDialog = dynamic(
  () =>
    import('@/features/utilities/components/utility-payment-dialog').then(
      (m) => m.UtilityPaymentDialog,
    ),
  { ssr: false },
);

export default function TenantUtilitiesPage() {
  const { data: session } = useSession();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['utility-invoices', selectedMonth] as const,
    queryFn: (): Promise<Invoice[]> => billingApi.getUtilityInvoices(selectedMonth),
    enabled: !!session?.user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes: avoid frequent refetch
    gcTime: 30 * 60 * 1000, // keep cached data around for quick back/forward
    refetchOnWindowFocus: false,
    keepPreviousData: true,
    retry: 1,
  });

  const { paidInvoices, pendingInvoices, totalOwed } = useMemo(() => {
    const list: Invoice[] = invoices || [];
    const paid = list.filter((inv) => inv.status === 'PAID');
    const pending = list.filter((inv) => inv.status !== 'PAID');
    const owed = pending.reduce((sum: number, inv: Invoice) => sum + Number(inv.totalAmount), 0);
    return { paidInvoices: paid, pendingInvoices: pending, totalOwed: owed };
  }, [invoices]);

  const handlePayClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-40" />
          <p className="text-muted-foreground">Đang tải hóa đơn...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Hóa đơn điện nước</h1>
        <p className="text-muted-foreground mt-2">
          Xem và thanh toán hóa đơn dịch vụ của bạn
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Tổng số hóa đơn</p>
              <p className="text-3xl font-bold">{invoices?.length || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Chờ thanh toán</p>
              <p
                className="text-3xl font-bold"
                style={{ color: 'var(--warning)' }}
              >
                {pendingInvoices.length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card
          style={{
            borderLeft: '4px solid var(--primary)',
          }}
        >
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Tổng còn nợ</p>
              <p
                className="text-3xl font-bold"
                style={{ color: 'var(--primary)' }}
              >
                {new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND',
                }).format(totalOwed)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">
            Chờ thanh toán ({pendingInvoices.length})
          </TabsTrigger>
          <TabsTrigger value="paid">
            Đã thanh toán ({paidInvoices.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 mt-4">
          {pendingInvoices.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <CheckCircle2
                    className="h-12 w-12 mx-auto mb-2 opacity-40"
                    style={{ color: 'var(--success)' }}
                  />
                  <p className="text-muted-foreground">
                    Bạn không có hóa đơn nào chờ thanh toán
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingInvoices.map((invoice) => (
                <UtilityInvoiceCard
                  key={invoice.id}
                  invoice={invoice}
                  onPayClick={handlePayClick}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="paid" className="space-y-4 mt-4">
          {paidInvoices.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-40" />
                  <p className="text-muted-foreground">
                    Bạn chưa thanh toán hóa đơn nào
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {paidInvoices.map((invoice) => (
                <UtilityInvoiceCard
                  key={invoice.id}
                  invoice={invoice}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Payment Dialog */}
      <UtilityPaymentDialog
        invoice={selectedInvoice}
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        onSuccess={() => {
          setSelectedInvoice(null);
        }}
      />

      {/* Info Section */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin thanh toán</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">Phương thức thanh toán được hỗ trợ:</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>💳 Chuyển khoản ngân hàng</li>
              <li>📱 MoMo</li>
              <li>💰 ZaloPay</li>
              <li>💵 Tiền mặt</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
