import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";

// For server-side NextAuth, use full backend URL
const API_URL = process.env.BACKEND_API_URL || 'https://rental-room-api.azurewebsites.net';

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                try {
                    // Call backend login endpoint
                    const response = await fetch(`${API_URL}/api/v1/auth/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            email: credentials.email,
                            password: credentials.password,
                        }),
                    });

                    if (!response.ok) {
                        console.error('[NextAuth] Login failed:', response.status);
                        return null;
                    }

                    const data = await response.json();

                    // Return user data for NextAuth session
                    return {
                        id: data.user.id,
                        email: data.user.email,
                        name: data.user.fullName,
                        role: data.user.role,
                        accessToken: data.access_token, // Capture token from backend
                    };
                } catch (error) {
                    console.error('[NextAuth] Logic error:', error);
                    return null;
                }
            }
        }),
    ],
    session: {
        strategy: "jwt",
        maxAge: 7 * 24 * 60 * 60, // 7 days
    },
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
});
