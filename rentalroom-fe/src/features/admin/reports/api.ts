import type { Session } from "next-auth";
import { auth } from "@/auth";
import { adminOverviewSchema, adminMarketInsightsSchema, type AdminOverview, type AdminMarketInsights } from "./schemas";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? "http://localhost:3001";
const API_PREFIX = "/api/v1";

function buildUrl(path: string, params?: Record<string, string | number | undefined>) {
	const url = new URL(`${API_BASE}${API_PREFIX}${path}`);
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
