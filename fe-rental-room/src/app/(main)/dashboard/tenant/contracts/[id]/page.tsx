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
import { useToast } from '@/hooks/use-toast';

export default function ContractDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = React.use(props.params);
  return <ContractDetailClient id={id} />;
}

function ContractDetailClient({ id }: { id: string }) {
  const { toast } = useToast();
  const contractQuery = useContract(id);
  const invoicesQuery = useInvoices({ status: undefined });
  const terminateMutation = useTerminateContract();
  const contract = contractQuery.data as Contract | undefined;
  const [openTerminate, setOpenTerminate] = useState(false);

  const onConfirmTerminate = async (data: { reason: string; noticeDays: number }) => {
    try {
      await terminateMutation.mutateAsync({ id, data });
      toast({ title: 'Hợp đồng đã được chấm dứt', description: 'Vui lòng kiểm tra thông báo để biết chi tiết xử lý tiền cọc.' });
      setOpenTerminate(false);
    } catch (e: any) {
      toast({ title: 'Lỗi', description: e?.message || 'Không thể chấm dứt hợp đồng', variant: 'destructive' });
    }
  };

  // Calculate days remaining
  const daysRemaining = contract ? Math.ceil((new Date(contract.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
      <Card className="rounded-2xl">
        <CardHeader className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle>Chi tiết hợp đồng</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {contractQuery.isLoading && (
            <div className="space-y-3">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-40 w-full rounded-lg" />
            </div>
          )}

          {!contractQuery.isLoading && !contract && (
            <div className="text-center py-8 text-muted-foreground">Không tìm thấy hợp đồng.</div>
          )}

          {!contractQuery.isLoading && contract && (
            <>
              <ContractSummary contract={contract} />
              <ContractTerms contract={contract} />
              <div>
                <h4 className="text-sm font-medium mb-2">Hóa đơn liên quan</h4>
                <InvoiceList loading={invoicesQuery.isLoading} invoices={invoicesQuery.data?.data} />
              </div>
              <div className="flex items-center justify-end gap-3">
                <Button variant="outline" className="gap-2">Tải hợp đồng</Button>
                {contract.status === ContractStatus.ACTIVE && (
                  <Button variant="destructive" onClick={() => setOpenTerminate(true)}>Chấm dứt hợp đồng</Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <TerminateDialog 
        open={openTerminate} 
        onOpenChange={setOpenTerminate} 
        onConfirm={onConfirmTerminate} 
        loading={terminateMutation.isPending}
        depositAmount={contract?.deposit || 0}
        daysRemaining={daysRemaining}
        isTenant={true}
      />
    </div>
  );
}
