import api from '@/lib/api/client';
import type {
	Property,
	CreatePropertyDto,
	PaginatedResponse,
	PaginationParams,
} from '@/types';

export const propertiesApi = {
	async getAll(params?: PaginationParams & { landlordId?: string }) {
		const { data } = await api.get<PaginatedResponse<Property>>('/properties', {
			params: params as Record<string, unknown>,
		});
		return data;
	},

	async getById(id: string) {
		const { data } = await api.get<Property>(`/properties/${id}`);
		return data;
	},

	async create(dto: CreatePropertyDto) {
		const { data } = await api.post<Property>('/properties', dto);
		return data;
	},

	async update(id: string, dto: Partial<CreatePropertyDto>) {
		const { data } = await api.patch<Property>(`/properties/${id}`, dto);
		return data;
	},

	async delete(id: string) {
		await api.delete(`/properties/${id}`);
	},
};
