import { type AdminOverview, type AdminMarketInsights } from "./schemas";

export type PlatformMetricsDto = AdminOverview["trends"][number];
export type TopLandlord = AdminOverview["topPerformers"]["landlords"][number];
export type TopProperty = AdminOverview["topPerformers"]["properties"][number];
export type PriceAnalysis = AdminMarketInsights["priceAnalysis"][number];
export type PopularSearch = AdminMarketInsights["popularSearches"][number];
