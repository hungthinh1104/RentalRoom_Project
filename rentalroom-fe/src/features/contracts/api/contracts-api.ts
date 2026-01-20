import api from '@/lib/api/client';
import { config } from '@/lib/config';
import type {
	Contract,
	RentalApplication,
	CreateContractDto,
	PaginatedResponse,
	PaginationParams,
} from '@/types';

// PDF download
export const getContractPdf = async (contractId: string) => {
	const response = await fetch(`/api/v1/contracts/${contractId}/pdf`, {
		method: 'GET',
		headers: {
			// Assuming auth token is handled globally via cookies
		},
	});
	if (!response.ok) {
		const error = await response.text();
		throw new Error(`Failed to fetch PDF: ${error}`);
	}
	const blob = await response.blob();
	const url = window.URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = `contract-${contractId}.pdf`;
	a.click();
	window.URL.revokeObjectURL(url);
};

export const contractsApi = {
	// Applications
	async createApplication(dto: {
		tenantId: string;
		roomId: string;
		landlordId?: string; // Optional - backend will fetch if not provided
		message?: string;
		requestedMoveInDate?: string;
	}) {
		const { data } = await api.post<RentalApplication>(
			'/contracts/applications',
			dto,
		);
		return data;
	},

	async getApplications(params?: PaginationParams & { tenantId?: string; landlordId?: string; status?: string }) {
		const { data } = await api.get<PaginatedResponse<RentalApplication>>(
			'/contracts/applications',
			{ params: params as Record<string, unknown> },
		);
		return data;
	},

	async getApplicationById(id: string) {
		const { data } = await api.get<RentalApplication>(
			`/contracts/applications/${id}`,
		);
		return data;
	},

	async approveApplication(id: string) {
		const { data } = await api.patch<RentalApplication>(
			`/contracts/applications/${id}/approve`,
		);
		return data;
	},

	async rejectApplication(id: string) {
		const { data } = await api.patch<RentalApplication>(
			`/contracts/applications/${id}/reject`,
		);
		return data;
	},

	async withdrawApplication(id: string) {
		const { data } = await api.patch<RentalApplication>(
			`/contracts/applications/${id}/withdraw`,
		);
		return data;
	},

	// Tenant approves contract (two-party agreement)
	async tenantApproveContract(contractId: string) {
		const { data } = await api.patch<Contract>(
			`/contracts/${contractId}/tenant-approve`,
		);
		return data;
	},

	async sendContract(contractId: string) {
		const { data } = await api.patch<Contract>(`/contracts/${contractId}/send`);
		return data;
	},

	async verifyPaymentStatus(id: string) {
		const { data } = await api.get<{ success: boolean; status: string }>(`/contracts/${id}/payment-status`);
		return data;
	},

	async revokeContract(id: string) {
		const { data } = await api.patch<Contract>(`/contracts/${id}/revoke`);
		return data;
	},

	async requestChanges(id: string, reason: string) {
		const { data } = await api.patch<Contract>(`/contracts/${id}/request-changes`, { reason });
		return data;
	},

	// Contracts
	async createContract(dto: CreateContractDto) {
		const { data } = await api.post<Contract>('/contracts', dto);
		return data;
	},

	async getContracts(params?: PaginationParams & { tenantId?: string; status?: string }) {
		const { data } = await api.get<PaginatedResponse<Contract>>('/contracts', {
			params: params as Record<string, unknown>,
		});
		return data;
	},

	async getContractById(id: string) {
		const { data } = await api.get<Contract>(`/contracts/${id}`);
		return data;
	},

	async updateContract(id: string, dto: Partial<CreateContractDto>) {
		const { data } = await api.patch<Contract>(`/contracts/${id}`, dto);
		return data;
	},

	async terminateContract(id: string, data: { reason: string; noticeDays?: number; terminationType?: string; refundAmount?: number }) {
		const { data: result } = await api.patch<Contract>(`/contracts/${id}/terminate`, data);
		return result;
	},

	async renewContract(id: string, data: { newEndDate: string; newRentPrice?: number; increasePercentage?: number }) {
		const { data: result } = await api.post<Contract>(`/contracts/${id}/renew`, data);
		return result;
	},

	async deleteContract(id: string) {
		await api.delete(`/contracts/${id}`);
	},

	// Residents
	async addResident(id: string, data: { fullName: string; phoneNumber?: string; citizenId?: string; relationship?: string }) {
		const { data: result } = await api.post(`/contracts/${id}/residents`, data);
		return result;
	},

	async updateResident(id: string, residentId: string, data: { fullName?: string; phoneNumber?: string; citizenId?: string; relationship?: string }) {
		const { data: result } = await api.patch(`/contracts/${id}/residents/${residentId}`, data);
		return result;
	},

	async removeResident(id: string, residentId: string) {
		await api.delete(`/contracts/${id}/residents/${residentId}`);
	},

	// Download signed PDF (returns Blob)

	// Download signed PDF (returns Blob)
	async downloadSigned(contractId: string) {
		const baseUrl = config.api.url;

		const res = await fetch(`${baseUrl}/v1/contracts/${contractId}/download-signed`, {
			method: 'GET',
			credentials: 'include',
		});

		if (!res.ok) {
			const text = await res.text();
			let msg = `Failed to download contract (${res.status})`;
			try {
				const json = JSON.parse(text);
				msg = json?.message || msg;
			} catch { }
			throw new Error(msg);
		}

		const blob = await res.blob();
		return blob;
	},
};
