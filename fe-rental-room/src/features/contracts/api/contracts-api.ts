import api from '@/lib/api/client';
import type {
	Contract,
	RentalApplication,
	CreateContractDto,
	PaginatedResponse,
	PaginationParams,
} from '@/types';

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

	async terminateContract(id: string, data: { reason: string; noticeDays?: number }) {
		const { data: result } = await api.patch<Contract>(`/contracts/${id}/terminate`, data);
		return result;
	},

	async deleteContract(id: string) {
		await api.delete(`/contracts/${id}`);
	},

	// Download signed PDF (returns Blob)
	async downloadSigned(contractId: string) {
		const baseUrl =
			typeof window === 'undefined'
				? process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
				: process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? 'http://localhost:3001';

		const res = await fetch(`${baseUrl}/api/v1/contracts/${contractId}/download-signed`, {
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
