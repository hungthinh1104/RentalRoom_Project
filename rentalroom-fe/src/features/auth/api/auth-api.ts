import api from '@/lib/api/client';
import type { LoginDto, RegisterDto, AuthResponse } from '@/types';

export const authApi = {
	async register(dto: RegisterDto) {
		const { data } = await api.post<{ message: string }>('/auth/register', dto);
		return data;
	},

	async verifyEmail(code: string) {
		const { data } = await api.post<{ message: string }>('/auth/verify', {}, {
			params: { code },
		});
		return data;
	},

	async resendVerification(email: string) {
		const { data } = await api.post<{ message: string }>('/auth/resend-verification', { email });
		return data;
	},

	async login(dto: LoginDto) {
		const { data } = await api.post<AuthResponse>('/auth/login', dto);
		// Note: Authentication is now handled via NextAuth and HttpOnly cookies
		// This endpoint is kept for backwards compatibility but shouldn't be used directly
		return data;
	},

	async refreshToken(refreshToken?: string) {
		const body = refreshToken ? { refresh_token: refreshToken } : undefined;
		const { data } = await api.post<{ access_token: string }>('/auth/refresh', body);
		// Token refresh is now handled automatically by browser cookies
		return data;
	},

	async logout() {
		// Logout is now handled by NextAuth signOut
		// This function is kept for backwards compatibility
		await api.post('/auth/logout');
	},
};
