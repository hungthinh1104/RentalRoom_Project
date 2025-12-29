import api from '@/lib/api/client';
import type { LoginDto, RegisterDto, AuthResponse } from '@/types';
import { setAccessToken, clearTokens } from '@/lib/api/client';

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
		// Store access token only; refresh token is set as HttpOnly cookie by the server
		setAccessToken(data.access_token);
		return data;
	},

	async refreshToken(refreshToken?: string) {
		const body = refreshToken ? { refresh_token: refreshToken } : undefined;
		const { data } = await api.post<{ access_token: string }>('/auth/refresh', body);
		setAccessToken(data.access_token);
		return data;
	},

	logout() {
		clearTokens();
	},
};
