"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

/**
 * Syncs tokens from NextAuth session to localStorage
 * This enables the API client to use the refresh token for token refresh
 */
export function TokenSync() {
    const { data: session, status } = useSession();

    useEffect(() => {
        if (status === "authenticated" && session) {
            // Sync access token
            if (session.accessToken) {
                localStorage.setItem("access_token", session.accessToken);
            }
            // Sync refresh token
            if (session.refreshToken) {
                localStorage.setItem("refresh_token", session.refreshToken);
            }
        } else if (status === "unauthenticated") {
            // Clear tokens on logout
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
        }
    }, [session, status]);

    return null; // This component doesn't render anything
}
