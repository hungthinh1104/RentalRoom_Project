import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;
	const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

	const authRoutes = ["/login", "/register"];
	const protectedRoutes = ["/dashboard", "/profile", "/properties", "/rooms"];
	const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
	const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

	// Role-based route checks
	// const isAdminRoute = pathname.startsWith("/dashboard/admin");
	// const isLandlordRoute = pathname.startsWith("/dashboard/landlord");
	// const isTenantRoute = pathname.startsWith("/dashboard/tenant");

	let response = NextResponse.next();

	// Redirect anonymous users away from protected areas
	if (isProtectedRoute && !token) {
		response = NextResponse.redirect(new URL("/login", request.url));
	}

	// ======== ROLE-BASED ACCESS CONTROL ========
	// Admin routes - ONLY for ADMIN role
	else if (pathname.startsWith("/dashboard/admin") && token?.role !== "ADMIN") {
		response = NextResponse.redirect(new URL("/unauthorized", request.url));
	}
	// Landlord routes - ONLY for LANDLORD role
	else if (pathname.startsWith("/dashboard/landlord") && token?.role !== "LANDLORD") {
		response = NextResponse.redirect(new URL("/unauthorized", request.url));
	}
	// Tenant routes - ONLY for TENANT role
	else if (pathname.startsWith("/dashboard/tenant") && token?.role !== "TENANT") {
		console.log('[Middleware] Tenant access denied - token:', token, 'role:', token?.role);
		response = NextResponse.redirect(new URL("/unauthorized", request.url));
	}
	// Redirect signed-in users away from auth pages (to their appropriate dashboard)
	else if (isAuthRoute && token) {
		const redirectMap = {
			ADMIN: "/dashboard/admin",
			LANDLORD: "/dashboard/landlord",
			TENANT: "/dashboard/tenant",
		};
		const dashboardUrl = redirectMap[token.role as keyof typeof redirectMap] || "/dashboard";
		response = NextResponse.redirect(new URL(dashboardUrl, request.url));
	}

	// SYNC BACKEND TOKEN: Set access_token cookie for the browser to use in API calls
	if (token?.accessToken) {
		response.cookies.set('access_token', token.accessToken as string, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			path: '/',
		});
	}

	return response;
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
