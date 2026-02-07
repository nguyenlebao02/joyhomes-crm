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
  REFERRAL: "Gioi thieu",
  WALK_IN: "Truc tiep",
  EVENT: "Su kien",
  HOTLINE: "Hotline",
  WEBSITE: "Website",
  OTHER: "Khac",
  UNKNOWN: "Chua xac dinh",
};

async function fetchCustomerSource() {
  const res = await fetch("/api/reports?type=customer-source");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
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
          <Skeleton className="h-[250px]" />
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
        <CardTitle>Nguon khach hang</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={80} className="text-xs" />
              <Tooltip
                formatter={(value) => [value ?? 0, "So luong"]}
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
