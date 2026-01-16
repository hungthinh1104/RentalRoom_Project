"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api/client";

// Query keys
export const adminContractKeys = {
    all: ["admin-contracts"] as const,
    list: (params?: { page?: number; search?: string; status?: string }) =>
        [...adminContractKeys.all, "list", params] as const,
};

export const adminPaymentKeys = {
    all: ["admin-payments"] as const,
    list: (params?: { page?: number; search?: string; status?: string }) =>
        [...adminPaymentKeys.all, "list", params] as const,
};

// Types
export interface Contract {
    id: string;
    contractNumber: string;
    tenantName: string;
    tenantEmail: string;
    propertyName: string;
    roomNumber: string;
    startDate: string;
    endDate: string;
    rentAmount: number;
    status: string;
}

export interface Payment {
    id: string;
    invoiceNumber: string;
    tenantName: string;
    propertyName: string;
    amount: number;
    dueDate: string;
    paidAt?: string;
    status: string;
}

interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
}

/**
 * Hook to fetch all contracts (admin view)
 */
export function useAdminContracts(params: { page?: number; search?: string; status?: string } = {}) {
    const { page = 1, search, status } = params;

    return useQuery({
        queryKey: adminContractKeys.list({ page, search, status }),
        queryFn: async () => {
            const queryParams: Record<string, unknown> = { page, limit: 10 };
            if (search) queryParams.search = search;
            if (status) queryParams.status = status;

            const { data } = await api.get<Contract[] | PaginatedResponse<Contract>>("/contracts", { params: queryParams });

            if (Array.isArray(data)) {
                return {
                    items: data.map(normalizeContract),
                    total: data.length,
                    page: 1,
                    limit: 10
                };
            }

            return {
                items: (data.items || []).map(normalizeContract),
                total: data.total || 0,
                page: data.page || 1,
                limit: data.limit || 10,
            };
        },
        staleTime: 30 * 1000,
        placeholderData: (prev: PaginatedResponse<Contract> | undefined) => prev,
    });
}

/**
 * Hook to fetch all payments/invoices (admin view)
 */
export function useAdminPayments(params: { page?: number; search?: string; status?: string } = {}) {
    const { page = 1, search, status } = params;

    return useQuery({
        queryKey: adminPaymentKeys.list({ page, search, status }),
        queryFn: async () => {
            const queryParams: Record<string, unknown> = { page, limit: 10 };
            if (search) queryParams.search = search;
            if (status) queryParams.status = status;

            const { data } = await api.get<Payment[] | PaginatedResponse<Payment>>("/invoices", { params: queryParams });

            if (Array.isArray(data)) {
                return {
                    items: data.map(normalizePayment),
                    total: data.length,
                    page: 1,
                    limit: 10
                };
            }

            return {
                items: (data.items || []).map(normalizePayment),
                total: data.total || 0,
                page: data.page || 1,
                limit: data.limit || 10,
            };
        },
        staleTime: 30 * 1000,
        placeholderData: (prev: PaginatedResponse<Payment> | undefined) => prev,
    });
}

/**
 * Hook to terminate contract (admin only)
 */
export function useTerminateContract() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ contractId, reason }: { contractId: string; reason?: string }) => {
            const { data } = await api.post(`/contracts/${contractId}/terminate`, { reason });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminContractKeys.all });
        },
    });
}

/**
 * Hook to mark payment as paid
 */
export function useMarkPaymentPaid() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (invoiceId: string) => {
            const { data } = await api.patch(`/invoices/${invoiceId}`, { status: "PAID", paidAt: new Date().toISOString() });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminPaymentKeys.all });
        },
    });
}

// Normalize functions
function normalizeContract(c: any): Contract {
    return {
        id: c.id,
        contractNumber: c.contractNumber || `CT-${c.id.slice(0, 8)}`,
        tenantName: c.tenant?.user?.fullName || c.tenantName || "N/A",
        tenantEmail: c.tenant?.user?.email || c.tenantEmail || "",
        propertyName: c.room?.property?.name || c.propertyName || "N/A",
        roomNumber: c.room?.roomNumber || c.roomNumber || "N/A",
        startDate: c.startDate,
        endDate: c.endDate,
        rentAmount: c.rentAmount || c.monthlyRent || 0,
        status: c.status || "ACTIVE",
    };
}

function normalizePayment(p: any): Payment {
    return {
        id: p.id,
        invoiceNumber: p.invoiceNumber || `INV-${p.id.slice(0, 8)}`,
        tenantName: p.contract?.tenant?.user?.fullName || p.tenantName || "N/A",
        propertyName: p.contract?.room?.property?.name || p.propertyName || "N/A",
        amount: p.amount || p.totalAmount || 0,
        dueDate: p.dueDate,
        paidAt: p.paidAt,
        status: p.status || "PENDING",
    };
}
