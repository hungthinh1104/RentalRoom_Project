import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { authApi } from "@/features/auth/api/auth-api";

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
          const response = await authApi.login({
            email: credentials.email,
            password: credentials.password,
          });

          if (response.user) {
            return {
              id: response.user.id,
              email: response.user.email,
              name: response.user.fullName || response.user.email,
              role: response.user.role,
              accessToken: response.access_token,
              refreshToken: response.refresh_token,
            };
          }
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // On initial sign-in, store tokens from the API response
      if (user) {
        token.id = user.id;
        token.role = user.role;
        // Store tokens in JWT for persistence across requests
        if (user.accessToken) token.accessToken = user.accessToken;
        if (user.refreshToken) token.refreshToken = user.refreshToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      // Expose tokens on session so client can sync to localStorage
      session.accessToken = token.accessToken as string | undefined;
      session.refreshToken = token.refreshToken as string | undefined;
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Nếu URL không tồn tại, fallback
      if (!url) return baseUrl;
      // Nếu URL là relative (bắt đầu bằng /) thì dùng nó
      if (typeof url === 'string' && url.startsWith('/')) {
        return url;
      }
      // Nếu URL là absolute, thử parse origin (bảo vệ khi URL không hợp lệ)
      try {
        const parsed = new URL(url);
        if (parsed.origin === baseUrl) return url;
      } catch (e) {
        // URL invalid, fallback
        console.warn('[auth] redirect: invalid url', url, e);
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
  },
  secret: process.env.NEXTAUTH_SECRET,
};
