"use client";

import React, { use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useContract, useTerminateContract } from '@/features/contracts/hooks/use-contracts';
import { ContractDetails } from "@/features/contracts/components/contract-details";
import { toast } from 'sonner';

export default function ContractDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params);
  const router = useRouter();

  const { data: contract, isLoading, error } = useContract(id);
  const terminateMutation = useTerminateContract();

  const handleTerminate = async (reason: string, noticeDays: number) => {
    try {
      await terminateMutation.mutateAsync({
        id,
        data: { reason, noticeDays },
      });
      toast.success("Đã chấm dứt hợp đồng thành công");
      // Page auto-refreshes via React Query invalidation in hook
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Có lỗi xảy ra khi chấm dứt hợp đồng"
      );
    }
  };

  if (isLoading) {
    return (
      <div className="container py-10 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="container py-10">
        <Alert variant="destructive">
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "Không tìm thấy hợp đồng"}
          </AlertDescription>
        </Alert>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-5xl">
      <div className='flex items-center gap-4 mb-6'>
        <Button
          variant="ghost"
          className="pl-0 hover:bg-transparent hover:text-primary"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại danh sách
        </Button>
      </div>

      <ContractDetails
        contract={contract}
        onTerminate={handleTerminate}
        isTerminating={terminateMutation.isPending}
      />
    </div>
  );
}
