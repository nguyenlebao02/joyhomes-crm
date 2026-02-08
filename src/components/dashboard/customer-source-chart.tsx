"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface CustomerSourceData {
  source: string;
  count: number;
}

const SOURCE_LABELS: Record<string, string> = {
  FACEBOOK: "Facebook",
  GOOGLE: "Google",
  ZALO: "Zalo",
  REFERRAL: "Giới thiệu",
  WALK_IN: "Trực tiếp",
  EVENT: "Sự kiện",
  HOTLINE: "Hotline",
  WEBSITE: "Website",
  OTHER: "Khác",
  UNKNOWN: "Chưa xác định",
};

async function fetchCustomerSource() {
  const res = await fetch("/api/reports?type=customer-source");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border bg-card p-3 shadow-lg">
      <p className="mb-1 text-sm font-medium">{label}</p>
      <p className="text-xs text-muted-foreground">
        Số lượng: <span className="font-medium text-foreground">{payload[0].value}</span>
      </p>
    </div>
  );
}

export function CustomerSourceChart() {
  const { data, isLoading } = useQuery<CustomerSourceData[]>({
    queryKey: ["customer-source"],
    queryFn: fetchCustomerSource,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[280px]" />
        </CardContent>
      </Card>
    );
  }

  const chartData = (data || [])
    .map((item) => ({
      name: SOURCE_LABELS[item.source] || item.source,
      value: item.count,
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nguồn khách hàng</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#0F766E" stopOpacity={0.85} />
                  <stop offset="100%" stopColor="#0F766E" stopOpacity={1} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border)"
                horizontal={false}
              />
              <XAxis
                type="number"
                tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                dataKey="name"
                type="category"
                width={80}
                tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="value"
                fill="url(#barGradient)"
                radius={[0, 6, 6, 0]}
                barSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
