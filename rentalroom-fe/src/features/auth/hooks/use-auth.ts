/**
 * Auth Hooks - Barrel Export
 * 
 * Centralized export for all authentication hooks
 * Use individual imports for better tree-shaking
 */

export { useLogin } from './use-login';
export { useRegister, useVerifyEmail, useResendVerification } from './use-register';
export { useSession, useLogout } from './use-session';
