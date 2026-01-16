"use client";

import { RevenueChart, OccupancyChart } from "./charts";

interface RevenueChartClientProps {
  data?: Array<{ month: string; revenue: number }>;
}

interface OccupancyChartClientProps {
  totalRooms: number;
  occupiedRooms: number;
}

export function RevenueChartClient({ data }: RevenueChartClientProps) {
  return <RevenueChart data={data} />;
}

export function OccupancyChartClient({ totalRooms, occupiedRooms }: OccupancyChartClientProps) {
  return <OccupancyChart totalRooms={totalRooms} occupiedRooms={occupiedRooms} />;
}
