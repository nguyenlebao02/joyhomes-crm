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
  Legend,
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
  if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)} tỷ`;
  if (value >= 1000000) return `${(value / 1000000).toFixed(0)} tr`;
  return value.toString();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border bg-card p-3 shadow-lg">
      <p className="mb-2 text-xs font-medium text-muted-foreground">
        {format(parseISO(label), "dd/MM/yyyy", { locale: vi })}
      </p>
      {payload.map((entry: { color: string; name: string; value: number }) => (
        <div key={entry.name} className="flex items-center gap-2 text-sm">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">
            {entry.name === "revenue" ? "Doanh thu" : "Hoa hồng"}:
          </span>
          <span className="font-medium">{formatPrice(entry.value)} VNĐ</span>
        </div>
      ))}
    </div>
  );
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
        <CardTitle>Doanh thu {days} ngày gần nhất</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data || []}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1B84FF" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#1B84FF" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradCommission" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => format(parseISO(value), "dd/MM", { locale: vi })}
                tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={formatPrice}
                tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value: string) =>
                  value === "revenue" ? "Doanh thu" : "Hoa hồng"
                }
                iconType="circle"
                iconSize={8}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#1B84FF"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#gradRevenue)"
                name="revenue"
                dot={false}
                activeDot={{ r: 5, fill: "#1B84FF", stroke: "#fff", strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="commission"
                stroke="#10B981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#gradCommission)"
                name="commission"
                dot={false}
                activeDot={{ r: 5, fill: "#10B981", stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
