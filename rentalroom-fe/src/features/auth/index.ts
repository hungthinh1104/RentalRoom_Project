/**
 * Auth Feature - Public API
 * 
 * Barrel export for clean imports across the app
 * 
 * @example
 * import { useLogin, LoginForm, loginSchema } from '@/features/auth'
 */

// Components
export { LoginForm } from './components/login-form';
export { RegisterForm } from './components/register-form';
export { VerifyEmailForm } from './components/verify-email-form';
export { LogoutButton } from './components/logout-button';

// Hooks
export { 
	useLogin,
	useRegister,
	useVerifyEmail,
	useResendVerification,
	useSession,
	useLogout,
} from './hooks/use-auth';

// Schemas
export {
	loginSchema,
	registerSchema,
	verifyEmailSchema,
	resendVerificationSchema,
	forgotPasswordSchema,
	resetPasswordSchema,
	type LoginInput,
	type RegisterInput,
	type VerifyEmailInput,
	type ResendVerificationInput,
	type ForgotPasswordInput,
	type ResetPasswordInput,
} from './schemas';

// Types
export type {
	LoginFormData,
	RegisterFormData,
	VerificationFormData,
	AuthState,
} from './types';

export { ROLE_DASHBOARD_ROUTES, AuthErrorCode } from './types';

// Query keys
export { authKeys, authMutations } from './api/auth-queries';

// API (rarely needed directly)
export { authApi } from './api/auth-api';
