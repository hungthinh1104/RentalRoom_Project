import api from '@/lib/api/client';
import type {
	Payment,
	Invoice,
	CreatePaymentDto,
	PaginatedResponse,
	PaginationParams,
} from '@/types';

export const paymentsApi = {
	async getAll(params?: PaginationParams & { tenantId?: string; status?: string }) {
		const { data } = await api.get<PaginatedResponse<Payment>>('/payments', {
			params: params as Record<string, unknown>,
		});
		return data;
	},

	async getById(id: string) {
		const { data } = await api.get<Payment>(`/payments/${id}`);
		return data;
	},

	async create(dto: CreatePaymentDto) {
		const { data } = await api.post<Payment>('/payments', dto);
		return data;
	},

	async update(id: string, dto: Partial<CreatePaymentDto>) {
		const { data } = await api.patch<Payment>(`/payments/${id}`, dto);
		return data;
	},

	async confirm(id: string) {
		const { data } = await api.patch<Payment>(`/payments/${id}/confirm`);
		return data;
	},

	async delete(id: string) {
		await api.delete(`/payments/${id}`);
	},
};

// Billing/Invoice API
export const billingApi = {
	async createInvoice(dto: {
		contractId: string;
		billingMonth: string;
		dueDate: string;
		totalAmount: number;
	}) {
		const { data } = await api.post<Invoice>('/billing/invoices', dto);
		return data;
	},

	async addLineItem(
		invoiceId: string,
		dto: { description: string; quantity: number; unitPrice: number; amount: number },
	) {
		const { data } = await api.post(`/billing/invoices/${invoiceId}/items`, dto);
		return data;
	},

	async getInvoices(params?: PaginationParams & { status?: string }) {
		const { data } = await api.get<PaginatedResponse<Invoice>>('/billing/invoices', {
			params: params as Record<string, unknown>,
		});
		return data;
	},

	async getInvoiceById(id: string) {
		const { data } = await api.get<Invoice>(`/billing/invoices/${id}`);
		return data;
	},

	async updateInvoice(id: string, dto: Partial<{ dueDate: string; totalAmount: number }>) {
		const { data } = await api.patch<Invoice>(`/billing/invoices/${id}`, dto);
		return data;
	},

	async markPaid(id: string) {
		const { data } = await api.patch<Invoice>(`/billing/invoices/${id}/mark-paid`);
		return data;
	},

	async deleteInvoice(id: string) {
		await api.delete(`/billing/invoices/${id}`);
	},
};
