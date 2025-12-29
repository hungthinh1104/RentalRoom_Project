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
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Không thể phê duyệt hợp đồng");
        },
    });
}
