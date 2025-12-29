import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;
	const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

	const authRoutes = ["/login", "/register"];
	const protectedRoutes = ["/dashboard", "/profile", "/properties", "/rooms"];
	const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
	const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

	// Role-based route checks
	const isAdminRoute = pathname.startsWith("/dashboard/admin");
	const isLandlordRoute = pathname.startsWith("/dashboard/landlord");
	const isTenantRoute = pathname.startsWith("/dashboard/tenant");

	// Redirect anonymous users away from protected areas
	if (isProtectedRoute && !token) {
		return NextResponse.redirect(new URL("/login", request.url));
	}

	// ======== ROLE-BASED ACCESS CONTROL ========

	// Admin routes - ONLY for ADMIN role
	if (isAdminRoute && token?.role !== "ADMIN") {
		return NextResponse.redirect(new URL("/unauthorized", request.url));
	}

	// Landlord routes - ONLY for LANDLORD role
	if (isLandlordRoute && token?.role !== "LANDLORD") {
		return NextResponse.redirect(new URL("/unauthorized", request.url));
	}

	// Tenant routes - ONLY for TENANT role
	if (isTenantRoute && token?.role !== "TENANT") {
		return NextResponse.redirect(new URL("/unauthorized", request.url));
	}

	// Redirect signed-in users away from auth pages (to their appropriate dashboard)
	if (isAuthRoute && token) {
		const redirectMap = {
			ADMIN: "/dashboard/admin",
			LANDLORD: "/dashboard/landlord",
			TENANT: "/dashboard/tenant",
		};
		const dashboardUrl = redirectMap[token.role as keyof typeof redirectMap] || "/dashboard";
		return NextResponse.redirect(new URL(dashboardUrl, request.url));
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
