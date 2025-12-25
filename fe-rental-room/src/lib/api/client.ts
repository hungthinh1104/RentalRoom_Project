/**
 * API Client with auth, error handling, and interceptors
 * Compatible with backend NestJS API
 */

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
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
	if (typeof window === 'undefined') return null;
	return localStorage.getItem('refresh_token');
};

const setRefreshToken = (token: string): void => {
	if (typeof window !== 'undefined') {
		localStorage.setItem('refresh_token', token);
	}
};

export const clearTokens = (): void => {
	if (typeof window !== 'undefined') {
		localStorage.removeItem('access_token');
		localStorage.removeItem('refresh_token');
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
	reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
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
	if (!refreshToken) {
		throw new Error('No refresh token available');
	}

	try {
		const res = await fetch(`${baseUrl}${apiPrefix}/auth/refresh`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ refreshToken }),
		});

		if (!res.ok) {
			throw new Error('Failed to refresh token');
		}

		const data = await res.json();
		setAccessToken(data.access_token);
		return data.access_token;
	} catch (error) {
		clearTokens();
		// Redirect to login
		if (typeof window !== 'undefined') {
			window.location.href = '/login';
		}
		throw error;
	}
}

interface RequestOptions {
	headers?: Record<string, string>;
	body?: any;
	params?: Record<string, any>;
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
		...(options?.body ? { body: JSON.stringify(options.body) } : {}),
	};

	let res = await fetch(fullUrl, fetchOptions);

	// Handle 401 - token expired, try refresh
	if (res.status === 401 && !url.includes('/auth/')) {
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
				processQueue(error, null);
				throw error;
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
	const data = text ? JSON.parse(text) : undefined;

	if (!res.ok) {
		throw new ApiError(
			res.status,
			data?.message || data?.error || 'Request failed',
			data?.error,
		);
	}

	return data as T;
}

const api = {
	get: async <T = any>(url: string, config?: RequestOptions) =>
		request<T>('GET', url, config),
	post: async <T = any>(url: string, body?: any, config?: RequestOptions) =>
		request<T>('POST', url, { ...config, body }),
	patch: async <T = any>(url: string, body?: any, config?: RequestOptions) =>
		request<T>('PATCH', url, { ...config, body }),
	put: async <T = any>(url: string, body?: any, config?: RequestOptions) =>
		request<T>('PUT', url, { ...config, body }),
	delete: async <T = any>(url: string, config?: RequestOptions) =>
		request<T>('DELETE', url, config),
};

export default api;
export { setAccessToken, setRefreshToken, getAccessToken, getRefreshToken };
