import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/auth-api';
import type { RegisterDto } from '@/types';

/**
 * Hook for user registration
 * Creates new user account and sends verification email
 * 
 * @example
 * const { mutate: register, isPending, error } = useRegister()
 * 
 * register(userData, {
 *   onSuccess: () => {
 *     toast.success("Đăng ký thành công! Vui lòng kiểm tra email.")
 *     router.push("/verify-email")
 *   }
 * })
 */
export function useRegister() {
	return useMutation({
		mutationFn: (dto: RegisterDto) => authApi.register(dto),
		meta: {
			errorMessage: 'Đăng ký thất bại. Email hoặc số điện thoại đã tồn tại.',
		},
	});
}

/**
 * Hook for email verification
 * Verifies user email with code from email
 * 
 * @example
 * const { mutate: verify, isPending } = useVerifyEmail()
 * verify(code, {
 *   onSuccess: () => router.push("/login")
 * })
 */
export function useVerifyEmail() {
	return useMutation({
		mutationFn: (code: string) => authApi.verifyEmail(code),
		meta: {
			errorMessage: 'Mã xác thực không hợp lệ hoặc đã hết hạn.',
		},
	});
}

/**
 * Hook for resending verification email
 * Sends new verification code to user's email
 * 
 * @example
 * const { mutate: resend, isPending } = useResendVerification()
 * resend(email, {
 *   onSuccess: () => toast.success("Đã gửi lại email xác thực")
 * })
 */
export function useResendVerification() {
	return useMutation({
		mutationFn: (email: string) => authApi.resendVerification(email),
		meta: {
			errorMessage: 'Không thể gửi lại email. Vui lòng thử lại sau.',
		},
	});
}
