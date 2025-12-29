import { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession as useNextAuthSession } from 'next-auth/react';
import { authApi } from '../api/auth-api';
import { setAccessToken, clearTokens } from '@/lib/api/client';

/**
 * Hook for accessing current user session
 * Wraps NextAuth useSession with type safety
 * 
 * @example
 * const { data: session, status } = useSession()
 * 
 * if (status === "authenticated") {
 *   console.log(session.user.role) // TENANT | LANDLORD
 * }
 */
export function useSession() {
	const sessionResult = useNextAuthSession();

	// Sync tokens from NextAuth session to API client helpers (client-side)
	useEffect(() => {
		if (typeof window === 'undefined') return;
		const { accessToken } = sessionResult.data ?? {};
		if (accessToken) setAccessToken(accessToken);
		// We no longer persist refresh tokens client-side (cookie-only refresh)
		// If session lost, clear client tokens
		if (!accessToken && sessionResult.status === 'unauthenticated') {
			clearTokens();
		}
	}, [sessionResult.data, sessionResult.status]);

	return sessionResult;
}

/**
 * Hook for user logout
 * Clears tokens and query cache
 * 
 * @example
 * const { mutate: logout, isPending } = useLogout()
 * 
 * logout(undefined, {
 *   onSuccess: () => router.push("/login")
 * })
 */
export function useLogout() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: () => {
			// Clear localStorage tokens
			authApi.logout();
			return Promise.resolve();
		},
		onSuccess: () => {
			// Clear all cached data
			queryClient.clear();
		},
	});
}
