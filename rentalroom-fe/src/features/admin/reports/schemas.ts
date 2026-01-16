import { z } from "zod";

export const platformMetricsSchema = z.object({
	period: z.string(),
	totalUsers: z.number(),
	newTenants: z.number(),
	newLandlords: z.number(),
	activeContracts: z.number(),
	totalRevenue: z.number(),
	averageOccupancy: z.number(),
});

export const adminOverviewSchema = z.object({
	summary: z.object({
		totalUsers: z.number(),
		totalTenants: z.number(),
		totalLandlords: z.number(),
		totalProperties: z.number(),
		totalRooms: z.number(),
		activeContracts: z.number(),
		platformRevenue: z.number(),
		averageOccupancy: z.number(),
	}),
	trends: z.array(platformMetricsSchema),
	topPerformers: z.object({
		landlords: z.array(
			z.object({
				landlordId: z.string(),
				name: z.string(),
				properties: z.number(),
				revenue: z.number(),
				occupancyRate: z.number(),
			}),
		),
		properties: z.array(
			z.object({
				propertyId: z.string(),
				name: z.string(),
				landlord: z.string(),
				occupancyRate: z.number(),
				revenue: z.number(),
			}),
		),
	}),
});

export type AdminOverview = z.infer<typeof adminOverviewSchema>;

export const marketPriceSchema = z.object({
	propertyType: z.string(),
	city: z.string(),
	ward: z.string(),
	averagePrice: z.number(),
	minPrice: z.number(),
	maxPrice: z.number(),
	totalListings: z.number(),
	occupancyRate: z.number(),
});

export const popularSearchSchema = z.object({
	query: z.string(),
	searchCount: z.number(),
	lastSearched: z.string(),
});

export const adminMarketInsightsSchema = z.object({
	priceAnalysis: z.array(marketPriceSchema),
	popularSearches: z.array(popularSearchSchema),
	demandMetrics: z.object({
		totalSearches: z.number(),
		totalApplications: z.number(),
		conversionRate: z.number(),
		averageTimeToBook: z.number(),
	}),
	recommendations: z.array(z.string()),
});

export type AdminMarketInsights = z.infer<typeof adminMarketInsightsSchema>;
