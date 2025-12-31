/**
 * Simplified API Client with HttpOnly cookie authentication
 * All authentication is handled via NextAuth session cookies
 */

const baseUrl =
	typeof window === 'undefined'
		? process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3005'
		: process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? 'http://localhost:3005';
const apiPrefix = '/api/v1';

// Custom error class
export class ApiError extends Error {
	constructor(
		public statusCode: number,
		public message: string,
		public error?: string,
	) {
		super(message);
		this.name = 'ApiError';
	}
}

interface RequestOptions {
	headers?: Record<string, string>;
	body?: unknown;
	params?: Record<string, unknown>;
	responseType?: 'json' | 'blob' | 'text';
}

async function request<T>(
	method: string,
	url: string,
	options?: RequestOptions,
): Promise<{ data: T }> {
	// Build query params
	let fullUrl = `${baseUrl}${apiPrefix}${url}`;
	if (options?.params) {
		const searchParams = new URLSearchParams();
		Object.entries(options.params).forEach(([key, value]) => {
			if (value !== undefined && value !== null) {
				searchParams.append(key, String(value));
			}
		});
		const queryString = searchParams.toString();
		if (queryString) {
			fullUrl += `?${queryString}`;
		}
	}

	// Build headers
	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
		...(options?.headers ?? {}),
	};

	// Make request with credentials (sends HttpOnly cookies automatically)
	const fetchOptions: RequestInit = {
		method,
		headers,
		credentials: 'include', // CRITICAL: Always send cookies for authentication
		cache: 'no-store',
		...(options?.body ? { body: JSON.stringify(options.body) } : {}),
	};

	// Debug log
	if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
		console.debug('[API Client] Request:', { method, fullUrl });
	}

	let res: Response;
	try {
		res = await fetch(fullUrl, fetchOptions);
	} catch (fetchError) {
		console.error('[API Client] Network error:', {
			url: fullUrl,
			method,
			message: fetchError instanceof Error ? fetchError.message : String(fetchError),
			online: typeof window !== 'undefined' ? navigator.onLine : undefined,
		});
		const message = fetchError instanceof Error ? fetchError.message : 'Unknown error';
		throw new ApiError(0, `Network error: ${message}. Check if backend is running.`);
	}

	// Handle 401 - Session expired, redirect to login
	if (res.status === 401 && !url.includes('/auth/')) {
		if (typeof window !== 'undefined') {
			console.warn('[API Client] 401 Unauthorized - Session expired');

			// Dynamically import signOut to avoid server-side import issues or circular deps
			import('next-auth/react').then(({ signOut }) => {
				signOut({ callbackUrl: '/api/auth/signin', redirect: true });
			});
		}
		throw new ApiError(401, 'Session expired. Please log in again.');
	}

	// Handle specific response types
	if (options?.responseType === 'blob') {
		if (!res.ok) {
			throw new ApiError(res.status, `Request failed (${res.status})`);
		}
		const blob = await res.blob();
		return { data: blob as unknown as T };
	}

	// Handle response
	return { data: await handleResponse<T>(res) };
}

async function handleResponse<T>(res: Response): Promise<T> {
	const text = await res.text();
	let data: unknown = undefined;
	if (text) {
		try {
			data = JSON.parse(text);
		} catch {
			data = undefined;
		}
	}

	if (!res.ok) {
		const info = {
			url: res.url,
			status: res.status,
			statusText: res.statusText,
			body: text || null,
		};
		if (res.status === 404) {
			console.info('[API] 404 - endpoint not found:', info);
		} else {
			console.warn('[API] request failed:', info);
		}
		const errorData = data as { message?: string; error?: string };
		throw new ApiError(
			res.status,
			errorData?.message || errorData?.error || `Request failed (${res.status})`,
			errorData?.error,
		);
	}

	return data as T;
}

const api = {
	get: async <T = unknown>(url: string, config?: RequestOptions) =>
		request<T>('GET', url, config),
	post: async <T = unknown>(url: string, body?: unknown, config?: RequestOptions) =>
		request<T>('POST', url, { ...config, body }),
	patch: async <T = unknown>(url: string, body?: unknown, config?: RequestOptions) =>
		request<T>('PATCH', url, { ...config, body }),
	put: async <T = unknown>(url: string, body?: unknown, config?: RequestOptions) =>
		request<T>('PUT', url, { ...config, body }),
	delete: async <T = unknown>(url: string, config?: RequestOptions) =>
		request<T>('DELETE', url, config),
};

export default api;
