import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3005';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
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
          // Call the new /auth/session endpoint
          const response = await fetch(`${API_URL}/api/v1/auth/session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
            credentials: 'include', // Important: send cookies
          });

          if (!response.ok) {
            if (process.env.NODE_ENV === 'development') {
              console.error('[NextAuth] Session validation failed:', response.status);
            }
            return null;
          }

          const user = await response.json();

          // Return user data for NextAuth session
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            accessToken: user.access_token, // Capture token from backend
          };
        } catch (error) {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // On initial sign-in, store user data in JWT
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role || 'TENANT';
        token.accessToken = (user as { accessToken?: string }).accessToken;
      }
      return token;
    },
    async session({ session, token }) {
      // Pass user data to client session
      if (session.user) {
        session.user.id = (token.id as string) || '';
        session.user.role = (token.role as string) || 'TENANT';
        (session as { accessToken?: string }).accessToken = (token.accessToken as string);
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Redirect logic after sign in/out
      if (!url) return baseUrl;
      if (typeof url === 'string' && url.startsWith('/')) {
        return url;
      }
      try {
        const parsed = new URL(url);
        if (parsed.origin === baseUrl) return url;
      } catch (e) {
        console.warn('[NextAuth] redirect: invalid url', url, e);
      }
      return baseUrl;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days to match backend refresh token
  },
  secret: process.env.NEXTAUTH_SECRET,
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  events: {},
};
