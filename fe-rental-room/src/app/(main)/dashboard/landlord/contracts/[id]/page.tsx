"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useContract, useTerminateContract } from "@/features/contracts/hooks/use-contracts";
import { ContractDetails } from "@/features/contracts/components/contract-details";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function ContractDetailPage({ params }: PageProps) {
    const { id } = use(params);
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
            // Page will auto refresh due to react-query dependency invalidation
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
            <Button
                variant="ghost"
                className="mb-6 pl-0 hover:bg-transparent hover:text-primary"
                onClick={() => router.back()}
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Quay lại danh sách
            </Button>

            <ContractDetails
                contract={contract}
                onTerminate={handleTerminate}
                isTerminating={terminateMutation.isPending}
            />
        </div>
    );
}
