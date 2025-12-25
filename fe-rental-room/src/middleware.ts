import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;
	
	// Get session token from cookies
	const sessionToken = request.cookies.get('next-auth.session-token')?.value;
	
	// Protected routes that require authentication
	const protectedRoutes = ['/dashboard', '/profile', '/properties', '/rooms'];
	const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
	
	// Auth routes that should redirect if already logged in
	const authRoutes = ['/login', '/register'];
	const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
	
	// If accessing protected route without session, redirect to login
	if (isProtectedRoute && !sessionToken) {
		return NextResponse.redirect(new URL('/login', request.url));
	}
	
	// If accessing auth route with session, redirect to dashboard
	if (isAuthRoute && sessionToken) {
		return NextResponse.redirect(new URL('/dashboard', request.url));
	}
	
	return NextResponse.next();
}

export const config = {
	matcher: ['/dashboard/:path*', '/profile/:path*', '/properties/:path*', '/rooms/:path*', '/login', '/register'],
};
