"use client";

import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface BookingStatusData {
  status: string;
  count: number;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  APPROVED: "#3b82f6",
  DEPOSITED: "#8b5cf6",
  CONTRACTED: "#06b6d4",
  COMPLETED: "#22c55e",
  CANCELLED: "#ef4444",
  REFUNDED: "#6b7280",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Cho duyet",
  APPROVED: "Da duyet",
  DEPOSITED: "Da coc",
  CONTRACTED: "Da ky HD",
  COMPLETED: "Hoan thanh",
  CANCELLED: "Da huy",
  REFUNDED: "Hoan tien",
};

async function fetchBookingStatus() {
  const res = await fetch("/api/reports?type=booking-status");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export function BookingStatusChart() {
  const { data, isLoading } = useQuery<BookingStatusData[]>({
    queryKey: ["booking-status"],
    queryFn: fetchBookingStatus,
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

  const chartData = (data || []).map((item) => ({
    name: STATUS_LABELS[item.status] || item.status,
    value: item.count,
    status: item.status,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Phan bo trang thai Booking</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={STATUS_COLORS[entry.status] || "#6b7280"}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [value ?? 0, "So luong"]}
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
