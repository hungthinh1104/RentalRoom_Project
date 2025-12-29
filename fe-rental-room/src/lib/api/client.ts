/**
* API Client with auth, error handling, and interceptors
* Compatible with backend NestJS API
*/

// Use a server-friendly base URL so NextAuth (server) hits the real API, not the Next app port
const baseUrl =
	typeof window === 'undefined'
		? process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
		: process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? 'http://localhost:3001';
const apiPrefix = '/api/v1';

// Token management
const getAccessToken = (): string | null => {
	if (typeof window === 'undefined') return null;
	return localStorage.getItem('access_token');
};

const setAccessToken = (token: string): void => {
	if (typeof window !== 'undefined') {
		localStorage.setItem('access_token', token);
	}
};

const getRefreshToken = (): string | null => {
	// Try localStorage first (fallback for when cookie isn't working)
	if (typeof window !== 'undefined') {
		const stored = localStorage.getItem('refresh_token');
		if (stored) return stored;
	}
	// Cookie-based refresh token is HttpOnly, not accessible from JS
	// Backend will read it from cookie header
	return null;
};

const setRefreshToken = (token?: string): void => {
	// Store in localStorage as fallback
	if (typeof window !== 'undefined' && token) {
		localStorage.setItem('refresh_token', token);
	}
};

export const clearTokens = (): void => {
	if (typeof window !== 'undefined') {
		localStorage.removeItem('access_token');
		localStorage.removeItem('refresh_token'); // Also clear refresh token
		// Do not touch refresh cookie (HttpOnly) from client-side
	}
};

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

// Refresh token helper
let isRefreshing = false;
let failedQueue: Array<{
	resolve: (token: string) => void;
	reject: (error: Error) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
	failedQueue.forEach((prom) => {
		if (error) {
			prom.reject(error);
		} else {
			prom.resolve(token!);
		}
	});
	failedQueue = [];
};

async function refreshAccessToken(): Promise<string> {
	const refreshToken = getRefreshToken();

	// If a stored refresh token exists, use it; otherwise try cookie-based refresh (HttpOnly cookie set by BE)
	try {
		let res: Response;
		if (refreshToken) {
			res = await fetch(`${baseUrl}${apiPrefix}/auth/refresh`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ refresh_token: refreshToken }),
				credentials: 'include',
			});
		} else {
			// No client-side refresh token: attempt cookie-based refresh
			res = await fetch(`${baseUrl}${apiPrefix}/auth/refresh`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
			});
		}

		if (!res.ok) {
			// Try to get error message from response
			let errorMsg = 'Failed to refresh token';
			try {
				const errorData = await res.json();
				errorMsg = errorData.message || errorMsg;
			} catch {
				// Response not JSON, use status text
				errorMsg = `${errorMsg} (${res.status} ${res.statusText})`;
			}
			console.error('[Auth] Refresh token failed:', errorMsg);
			throw new Error(errorMsg);
		}

		const data = await res.json();
		if (!data.access_token) {
			throw new Error('No access token in refresh response');
		}
		setAccessToken(data.access_token);
		return data.access_token;
	} catch (error) {
		console.error('[Auth] Refresh token error:', error);
		clearTokens();
		const err = error instanceof Error ? error : new Error(String(error));
		throw err;
	}
}

interface RequestOptions {
	headers?: Record<string, string>;
	body?: unknown;
	params?: Record<string, unknown>;
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

	// Add auth token
	const token = getAccessToken();
	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}

	// Make request
	const fetchOptions: RequestInit = {
		method,
		headers,
		credentials: 'include',
		cache: 'no-store', // Disable caching for all API requests to ensure freshness
		...(options?.body ? { body: JSON.stringify(options.body) } : {}),
	};

	// Debug log for troubleshooting
	if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
		console.debug('[API Client] Request:', { method, fullUrl, headers: { ...headers, Authorization: headers.Authorization ? '***' : undefined } });
	}

	let res: Response;
	try {
		res = await fetch(fullUrl, fetchOptions);
	} catch (fetchError) {
		// Network errors (CORS, DNS, connection refused, etc.)
		// Log raw error first to ensure we capture non-Error shapes in browser logs
		console.error('[API Client] Network raw error:', fetchError);
		const isError = fetchError instanceof Error;
		console.error('[API Client] Network error:', {
			url: fullUrl,
			method,
			message: isError ? fetchError.message : String(fetchError),
			rawError: fetchError,
			stack: isError ? (fetchError as Error).stack : undefined,
			env: { NODE_ENV: process.env.NODE_ENV, baseUrl },
			online: typeof window !== 'undefined' ? navigator.onLine : undefined,
		});
		const message = isError ? (fetchError as Error).message : String(fetchError || 'Unknown error');
		const apiErr = new ApiError(0, `Network error: ${message}. Check if backend is running at ${baseUrl}`);
		const apiErrWithOriginal = apiErr as ApiError & { original?: unknown };
		apiErrWithOriginal.original = fetchError;
		throw apiErrWithOriginal;
	}
	// Handle 401 - token expired, try refresh using HttpOnly cookie
	if (res.status === 401 && !url.includes('/auth/')) {
		// Always attempt cookie-based refresh (refresh token is HttpOnly)
		if (!isRefreshing) {
			isRefreshing = true;
			try {
				const newToken = await refreshAccessToken();
				isRefreshing = false;
				processQueue(null, newToken);

				// Retry original request with new token
				headers.Authorization = `Bearer ${newToken}`;
				res = await fetch(fullUrl, { ...fetchOptions, headers });
			} catch (error) {
				isRefreshing = false;
				const err = error instanceof Error ? error : new Error(String(error));
				processQueue(err, null);
				throw err;
			}
		} else {
			// Wait for refresh to complete
			return new Promise((resolve, reject) => {
				failedQueue.push({
					resolve: async (token: string) => {
						headers.Authorization = `Bearer ${token}`;
						try {
							const retryRes = await fetch(fullUrl, { ...fetchOptions, headers });
							const data = await handleResponse<T>(retryRes);
							resolve({ data });
						} catch (err) {
							reject(err);
						}
					},
					reject,
				});
			});
		}
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
			// leave data undefined if body is not JSON
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
		// 404s commonly mean the backend isn't running or the endpoint hasn't been
		// implemented yet. Log as info to avoid alarming warnings during local dev.
		if (res.status === 404) {
			console.info('[api] 404 - endpoint not found. Is backend running? Or endpoint implemented?', info);
		} else {
			console.warn('[api] request failed', info);
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
export { setAccessToken, setRefreshToken, getAccessToken, getRefreshToken };
