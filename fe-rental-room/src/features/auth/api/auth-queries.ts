/**
 * Auth Query Keys
 * 
 * Centralized React Query keys for auth-related queries
 * Follows TanStack Query best practices with factory pattern
 */

export const authKeys = {
	all: ['auth'] as const,
	
	// Current user session
	currentUser: () => [...authKeys.all, 'currentUser'] as const,
	
	// Auth status
	status: () => [...authKeys.all, 'status'] as const,
	
	// Token refresh
	refresh: () => [...authKeys.all, 'refresh'] as const,
} as const;

/**
 * Query key factory for auth mutations
 */
export const authMutations = {
	login: ['auth', 'login'] as const,
	register: ['auth', 'register'] as const,
	logout: ['auth', 'logout'] as const,
	verifyEmail: ['auth', 'verifyEmail'] as const,
	resendVerification: ['auth', 'resendVerification'] as const,
	forgotPassword: ['auth', 'forgotPassword'] as const,
	resetPassword: ['auth', 'resetPassword'] as const,
} as const;

/**
 * Example usage:
 * 
 * // In hook
 * useQuery({ queryKey: authKeys.currentUser(), ... })
 * 
 * // Invalidate user data
 * queryClient.invalidateQueries({ queryKey: authKeys.currentUser() })
 * 
 * // Clear all auth data
 * queryClient.removeQueries({ queryKey: authKeys.all })
 */
