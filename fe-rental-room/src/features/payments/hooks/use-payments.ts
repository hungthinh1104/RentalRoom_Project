import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentsApi, billingApi } from '../api/payments-api';
import type { CreatePaymentDto, PaginationParams } from '@/types';

export function usePayments(params?: PaginationParams & { tenantId?: string; status?: string }) {
	return useQuery({
		queryKey: ['payments', params],
		queryFn: () => paymentsApi.getAll(params),
	});
}

export function usePayment(id: string) {
	return useQuery({
		queryKey: ['payments', id],
		queryFn: () => paymentsApi.getById(id),
		enabled: !!id,
	});
}

export function useCreatePayment() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (dto: CreatePaymentDto) => paymentsApi.create(dto),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['payments'] });
			queryClient.invalidateQueries({ queryKey: ['invoices'] });
		},
	});
}

export function useConfirmPayment() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => paymentsApi.confirm(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['payments'] });
			queryClient.invalidateQueries({ queryKey: ['invoices'] });
		},
	});
}

// Invoice hooks
export function useInvoices(params?: PaginationParams & { status?: string }) {
	return useQuery({
		queryKey: ['invoices', params],
		queryFn: () => billingApi.getInvoices(params),
	});
}

export function useInvoice(id: string) {
	return useQuery({
		queryKey: ['invoices', id],
		queryFn: () => billingApi.getInvoiceById(id),
		enabled: !!id,
	});
}

export function useMarkInvoicePaid() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => billingApi.markPaid(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['invoices'] });
		},
	});
}
