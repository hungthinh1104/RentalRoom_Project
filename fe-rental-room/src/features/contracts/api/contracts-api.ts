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
		message?: string;
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
			{ params },
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

	// Contracts
	async createContract(dto: CreateContractDto) {
		const { data } = await api.post<Contract>('/contracts', dto);
		return data;
	},

	async getContracts(params?: PaginationParams & { tenantId?: string; status?: string }) {
		const { data } = await api.get<PaginatedResponse<Contract>>('/contracts', {
			params,
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
};
