"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";

interface RevenueTrendData {
  date: string;
  revenue: number;
  commission: number;
  count: number;
}

async function fetchRevenueTrend(days: number) {
  const res = await fetch(`/api/reports?type=revenue-trend&days=${days}`);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

function formatPrice(value: number): string {
  if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`;
  if (value >= 1000000) return `${(value / 1000000).toFixed(0)}M`;
  return value.toString();
}

interface SalesPerformanceChartProps {
  days?: number;
}

export function SalesPerformanceChart({ days = 30 }: SalesPerformanceChartProps) {
  const { data, isLoading } = useQuery<RevenueTrendData[]>({
    queryKey: ["revenue-trend", days],
    queryFn: () => fetchRevenueTrend(days),
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Doanh thu {days} ngay gan nhat</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data || []}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCommission" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => format(parseISO(value), "dd/MM", { locale: vi })}
                className="text-xs"
              />
              <YAxis tickFormatter={formatPrice} className="text-xs" />
              <Tooltip
                labelFormatter={(value) =>
                  format(parseISO(value as string), "dd/MM/yyyy", { locale: vi })
                }
                formatter={(value, name) => [
                  `${formatPrice(Number(value) || 0)} VND`,
                  name === "revenue" ? "Doanh thu" : "Hoa hong",
                ]}
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#22c55e"
                fillOpacity={1}
                fill="url(#colorRevenue)"
                name="revenue"
              />
              <Area
                type="monotone"
                dataKey="commission"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorCommission)"
                name="commission"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
