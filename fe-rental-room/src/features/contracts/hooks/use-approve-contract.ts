"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { contractsApi } from "../api/contracts-api";
import { toast } from "sonner";

export function useApproveContract() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (contractId: string) => contractsApi.tenantApproveContract(contractId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["contracts"] });
            toast.success("Hợp đồng đã được phê duyệt!");
        },
        onError: (error: unknown) => {
            const message = error && typeof error === 'object' && 'response' in error ? 
                (error as { response?: { data?: { message?: string } } }).response?.data?.message : undefined;
            toast.error(message || "Không thể phê duyệt hợp đồng");
        },
    });
}
