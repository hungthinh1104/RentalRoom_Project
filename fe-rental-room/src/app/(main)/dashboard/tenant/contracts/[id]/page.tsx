"use client";
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ContractSummary } from '@/features/contracts/components/contract-summary';
import { ContractTerms } from '@/features/contracts/components/contract-terms';
import { InvoiceList } from '@/features/contracts/components/invoice-list';
import { TerminateDialog } from '@/features/contracts/components/terminate-dialog';
import { useContract, useTerminateContract } from '@/features/contracts/hooks/use-contracts';
import { useInvoices } from '@/features/payments/hooks/use-payments';
import { ContractStatus, type Contract } from '@/types';
import { FileText } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { contractsApi } from '@/features/contracts/api/contracts-api';

export default function ContractDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = React.use(props.params);
  return <ContractDetailClient id={id} />;
}

function ContractDetailClient({ id }: { id: string }) {
  const contractQuery = useContract(id);
  const invoicesQuery = useInvoices({ status: undefined });
  const terminateMutation = useTerminateContract();
  const contract = contractQuery.data as Contract | undefined;
  const [openTerminate, setOpenTerminate] = useState(false);

  const onConfirmTerminate = async (data: { reason: string; noticeDays: number }) => {
    try {
      await terminateMutation.mutateAsync({ id, data });
      toast.success('Hợp đồng đã được chấm dứt. Vui lòng kiểm tra thông báo để biết chi tiết xử lý tiền cọc.');
      setOpenTerminate(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(msg || 'Không thể chấm dứt hợp đồng');
    }
  };

  // Calculate days remaining
  const daysRemaining = contract ? Math.ceil((new Date(contract.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!contract) return;
    setDownloading(true);
    try {
      const blob = await contractsApi.downloadSigned(contract.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contract-${contract.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Đang tải hợp đồng...');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(msg || 'Không thể tải hợp đồng');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Chi tiết hợp đồng</h1>
            <p className="text-muted-foreground mt-2">Xem thông tin chi tiết và lịch sử thanh toán</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2" onClick={handleDownload} disabled={downloading || !contract}>
              <FileText className="w-4 h-4" />
              {downloading ? 'Đang tải...' : 'Tải hợp đồng'}
            </Button>
            {contract?.status === ContractStatus.ACTIVE && (
              <Button variant="destructive" onClick={() => setOpenTerminate(true)}>Chấm dứt hợp đồng</Button>
            )}
          </div>
        </div>

        {contractQuery.isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        )}

        {!contractQuery.isLoading && !contract && (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <p className="text-muted-foreground">Không tìm thấy hợp đồng.</p>
            <Button variant="link" onClick={() => window.history.back()}>Quay lại</Button>
          </div>
        )}

        {!contractQuery.isLoading && contract && (
          <>
            <ContractSummary contract={contract} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <InvoiceList loading={invoicesQuery.isLoading} invoices={invoicesQuery.data?.data} />
              </div>
              <div className="lg:col-span-1">
                <ContractTerms contract={contract} />
              </div>
            </div>
          </>
        )}
      </div>

      <TerminateDialog
        open={openTerminate}
        onOpenChange={setOpenTerminate}
        onConfirm={onConfirmTerminate}
        loading={terminateMutation.isPending}
        deposit={contract?.deposit || 0}
        daysRemaining={daysRemaining}
        isTenant={true}
      />
    </div>
  );
}
