import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession as useNextAuthSession } from 'next-auth/react';
import { authApi } from '../api/auth-api';

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
	return useNextAuthSession();
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
			authApi.logout();
			return Promise.resolve();
		},
		onSuccess: () => {
			// Clear all cached data
			queryClient.clear();
		},
	});
}
