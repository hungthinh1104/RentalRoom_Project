import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;
	const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

	const authRoutes = ["/login", "/register"];
	const protectedRoutes = ["/dashboard", "/profile", "/properties", "/rooms"];
	const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
	const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
	const isAdminRoute = pathname.startsWith("/dashboard/admin");

	// Redirect anonymous users away from protected areas
	if (isProtectedRoute && !token) {
		return NextResponse.redirect(new URL("/login", request.url));
	}

	// Enforce admin RBAC for /dashboard/admin/*
	if (isAdminRoute && token?.role !== "ADMIN") {
		return NextResponse.redirect(new URL("/dashboard", request.url));
	}

	// Redirect signed-in users away from auth pages
	if (isAuthRoute && token) {
		return NextResponse.redirect(new URL("/dashboard", request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		"/dashboard/:path*",
		"/profile/:path*",
		"/properties/:path*",
		"/rooms/:path*",
		"/login",
		"/register",
	],
};
