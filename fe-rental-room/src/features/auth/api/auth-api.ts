import api from '@/lib/api/client';
import type { LoginDto, RegisterDto, AuthResponse } from '@/types';
import { setAccessToken, setRefreshToken, clearTokens } from '@/lib/api/client';

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
		const { data } = await api.post<{ message: string }>(
			'/auth/resend-verification',
			{ email },
		);
		return data;
	},

	async login(dto: LoginDto) {
		const { data } = await api.post<AuthResponse>('/auth/login', dto);
		// Store tokens
		setAccessToken(data.access_token);
		setRefreshToken(data.refresh_token);
		return data;
	},

	async refreshToken(refreshToken: string) {
		const { data } = await api.post<{ access_token: string }>('/auth/refresh', {
			refreshToken,
		});
		setAccessToken(data.access_token);
		return data;
	},

	logout() {
		clearTokens();
	},
};
