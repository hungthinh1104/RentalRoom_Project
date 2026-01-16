import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth-api';
import type { LoginDto, AuthResponse } from '@/types';

/**
 * Hook for user login
 * Handles login mutation and updates query cache with user data
 * 
 * @example
 * const { mutate: login, isPending, error } = useLogin()
 * 
 * login(credentials, {
 *   onSuccess: () => router.push("/dashboard")
 * })
 */
export function useLogin() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (dto: LoginDto) => authApi.login(dto),
		onSuccess: (data: AuthResponse) => {
			// Cache current user data
			queryClient.setQueryData(['currentUser'], data.user);
		},
		meta: {
			errorMessage: 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.',
		},
	});
}
