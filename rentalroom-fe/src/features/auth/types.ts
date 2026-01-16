/**
 * Auth Feature Types
 * 
 * Type definitions specific to authentication feature
 * Extends global types from @/types
 */

import type { User } from '@/types';

/**
 * Login form state
 */
export interface LoginFormData {
	email: string;
	password: string;
	rememberMe?: boolean;
}

/**
 * Register form state (extends backend DTO with UI-specific fields)
 */
export interface RegisterFormData {
	fullName: string;
	email: string;
	phone: string;
	password: string;
	confirmPassword: string;
	role: 'TENANT' | 'LANDLORD';
	agreeTerms?: boolean;
}

/**
 * Verification form state
 */
export interface VerificationFormData {
	code: string;
}

/**
 * Auth context state
 */
export interface AuthState {
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
}

/**
 * Role-specific dashboard routes
 */
export const ROLE_DASHBOARD_ROUTES = {
	TENANT: '/dashboard/tenant',
	LANDLORD: '/dashboard/landlord',
	ADMIN: '/dashboard/admin',
} as const;

/**
 * Auth error codes
 */
export enum AuthErrorCode {
	INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
	EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
	USER_NOT_FOUND = 'USER_NOT_FOUND',
	INVALID_TOKEN = 'INVALID_TOKEN',
	SESSION_EXPIRED = 'SESSION_EXPIRED',
}
