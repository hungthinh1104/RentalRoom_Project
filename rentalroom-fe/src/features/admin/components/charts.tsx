"use client";

import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, type PieLabelRenderProps } from "recharts";

const COLORS = ["#10b981", "#f3f4f6"];

interface RevenueChartProps {
  data?: Array<{ month: string; revenue: number }>;
}

interface OccupancyChartProps {
  totalRooms: number;
  occupiedRooms: number;
}

export function RevenueChart({ data }: RevenueChartProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Fallback to empty array if no data
  const chartData = data && data.length > 0 ? data : [
    { month: "Chưa có dữ liệu", revenue: 0 }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Doanh thu hàng tháng</CardTitle>
      </CardHeader>
      <CardContent>
        {mounted ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#10b981" name="Doanh thu (₫)" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <Skeleton className="w-full h-[300px] rounded-lg" />
        )}
      </CardContent>
    </Card>
  );
}

export function OccupancyChart({ totalRooms, occupiedRooms }: OccupancyChartProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
  const vacancyRate = 100 - occupancyRate;

  const occupancyData = [
    { name: "Lấp đầy", value: occupancyRate },
    { name: "Trống", value: vacancyRate },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Tỷ lệ lấp đầy</CardTitle>
        <p className="text-sm text-muted-foreground">
          {occupiedRooms} / {totalRooms} phòng
        </p>
      </CardHeader>
      <CardContent>
        {mounted ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={occupancyData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(props: PieLabelRenderProps) => {
                  const name = props.name ?? '';
                  const value = props.value ?? 0;
                  return `${name}: ${value}%`;
                }}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {occupancyData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <Skeleton className="w-full h-[300px] rounded-lg" />
        )}
      </CardContent>
    </Card>
  );
}
