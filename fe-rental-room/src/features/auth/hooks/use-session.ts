import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession as useNextAuthSession, signOut } from 'next-auth/react';

/**
 * Hook for accessing current user session
 * Wraps NextAuth useSession with type safety
 * All authentication is handled via HttpOnly cookies
 * 
 * @example
 * const { data: session, status } = useSession()
 * 
 * if (status === "authenticated") {
 *   console.log(session.user.role) // TENANT | LANDLORD | ADMIN
 * }
 */
export function useSession() {
	return useNextAuthSession();
}

/**
 * Hook for user logout
 * Uses NextAuth signOut to clear session cookies
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
		mutationFn: async () => {
			// Use NextAuth signOut to clear session properly
			await signOut({ redirect: false });
		},
		onSuccess: () => {
			// Clear all cached query data
			queryClient.clear();
		},
	});
}
