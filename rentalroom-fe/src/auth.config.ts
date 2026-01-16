import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
            const userRole = auth?.user?.role;

            if (isOnDashboard) {
                if (!isLoggedIn) return false; // Redirect unauthenticated users to login page

                // 1. Strict Role Checks for specific sub-paths
                if (nextUrl.pathname.startsWith("/dashboard/admin")) {
                    if (userRole !== 'ADMIN') {
                        // Redirect unauthorized users to their own dashboard or 403
                        // Here we redirect to their correct dashboard to be helpful/safe
                        return Response.redirect(new URL("/dashboard", nextUrl));
                    }
                }

                if (nextUrl.pathname.startsWith("/dashboard/landlord")) {
                    if (userRole !== 'LANDLORD') {
                        return Response.redirect(new URL("/dashboard", nextUrl));
                    }
                }

                if (nextUrl.pathname.startsWith("/dashboard/tenant")) {
                    if (userRole !== 'TENANT') {
                        return Response.redirect(new URL("/dashboard", nextUrl));
                    }
                }

                // 2. Handle generic /dashboard root
                // Redirect to the specific role dashboard
                if (nextUrl.pathname === "/dashboard") {
                    if (userRole === 'ADMIN') return Response.redirect(new URL("/dashboard/admin", nextUrl));
                    if (userRole === 'LANDLORD') return Response.redirect(new URL("/dashboard/landlord", nextUrl));
                    if (userRole === 'TENANT') return Response.redirect(new URL("/dashboard/tenant", nextUrl));
                    // If role is unknown or invalid, maybe allow them to stay (likely 404) or redirect to login?
                    // For safety/strictness, let's allow them to proceed if no specific rule matches, 
                    // BUT practically strictly typed roles should cover this.
                }

                return true;
            } else if (isLoggedIn) {
                // If logged in and on login/register page, redirect to dashboard
                if (nextUrl.pathname === "/login" || nextUrl.pathname === "/register") {
                    return Response.redirect(new URL("/dashboard", nextUrl));
                }
            }
            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id!;
                token.role = (user.role as string) || 'TENANT';
                token.accessToken = user.accessToken!; // Assert non-null if we are sure
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = (token.id as string) || '';
                session.user.role = (token.role as string) || 'TENANT';
                session.accessToken = (token.accessToken as string); // Assign to top level if typed there
                // Or if typed in user: session.user.accessToken = ...
                // My d.ts defined session.user.accessToken AND session.accessToken
                session.user.accessToken = (token.accessToken as string);
            }
            return session;
        },
    },
    providers: [], // Configured in auth.ts
} satisfies NextAuthConfig;
