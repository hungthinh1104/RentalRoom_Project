import type { Session } from "next-auth";
import { auth } from "@/auth";
import { adminOverviewSchema, adminMarketInsightsSchema, type AdminOverview, type AdminMarketInsights } from "./schemas";

const isServer = typeof window === "undefined";

// On server, use internal backend URL. On client, use proxy path.
import { config } from "@/lib/config";

// Use centralized config.
const API_BASE = config.api.url;

// If direct backend access (absolute URL), we need the explicit global prefix /api/v1.
// If using proxy (relative /api), the proxy rewrite adds /api/v1, so we avoid double prefixing.
const API_PREFIX = API_BASE.startsWith("http") ? "/api/v1" : "";

function buildUrl(path: string, params?: Record<string, string | number | undefined>) {
	const fullPath = `${API_BASE}${API_PREFIX}${path}`;

	// Handle relative URLs (client-side proxy usage)
	if (!fullPath.startsWith("http")) {
		if (isServer) {
			throw new Error(`Invalid server-side URL: ${fullPath}. Check BACKEND_API_URL.`);
		}
		const url = new URL(fullPath, window.location.origin);
		if (params) {
			Object.entries(params).forEach(([key, value]) => {
				if (value !== undefined && value !== null) {
					url.searchParams.set(key, String(value));
				}
			});
		}
		return url.pathname + url.search;
	}

	const url = new URL(fullPath);
	if (params) {
		Object.entries(params).forEach(([key, value]) => {
			if (value !== undefined && value !== null) {
				url.searchParams.set(key, String(value));
			}
		});
	}
	return url.toString();
}

async function fetchWithAuth<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
	const session = await auth();
	const accessToken = session?.accessToken;
	if (!accessToken) {
		throw new Error("Unauthorized: missing access token");
	}

	const res = await fetch(buildUrl(path, params), {
		headers: {
			Authorization: `Bearer ${accessToken}`,
		},
		cache: "no-store",
	});

	if (!res.ok) {
		const body = await res.text();
		throw new Error(`API error ${res.status}: ${body || res.statusText}`);
	}

	return res.json() as Promise<T>;
}

export async function getAdminOverview(params?: { period?: string; periods?: number }): Promise<AdminOverview> {
	const data = await fetchWithAuth<unknown>("/reports/admin/overview", params);
	return adminOverviewSchema.parse(data);
}

export async function getAdminMarketInsights(params?: { city?: string; ward?: string }): Promise<AdminMarketInsights> {
	const data = await fetchWithAuth<unknown>("/reports/admin/market-insights", params);
	return adminMarketInsightsSchema.parse(data);
}
