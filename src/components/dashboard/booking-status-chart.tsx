"use client";

import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface BookingStatusData {
  status: string;
  count: number;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#F59E0B",
  APPROVED: "#0F766E",
  DEPOSITED: "#8B5CF6",
  CONTRACTED: "#14B8A6",
  COMPLETED: "#10B981",
  CANCELLED: "#EF4444",
  REFUNDED: "#6B7280",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  DEPOSITED: "Đã cọc",
  CONTRACTED: "Đã ký HĐ",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
  REFUNDED: "Hoàn tiền",
};

async function fetchBookingStatus() {
  const res = await fetch("/api/reports?type=booking-status");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0];
  return (
    <div className="rounded-xl border bg-card p-3 shadow-lg">
      <div className="flex items-center gap-2 text-sm">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: data.payload.fill }}
        />
        <span className="font-medium">{data.name}</span>
        <span className="text-muted-foreground">({data.value})</span>
      </div>
    </div>
  );
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
          <Skeleton className="h-[280px]" />
        </CardContent>
      </Card>
    );
  }

  const chartData = (data || []).map((item) => ({
    name: STATUS_LABELS[item.status] || item.status,
    value: item.count,
    status: item.status,
  }));

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Phân bổ trạng thái Booking</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          {/* Donut chart with center stat */}
          <div className="relative h-[200px] w-[200px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={STATUS_COLORS[entry.status] || "#6B7280"}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold">{total}</span>
              <span className="text-xs text-muted-foreground">Tổng cộng</span>
            </div>
          </div>

          {/* Vertical legend */}
          <div className="flex flex-1 flex-col gap-2">
            {chartData.map((entry) => (
              <div key={entry.status} className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: STATUS_COLORS[entry.status] || "#6B7280" }}
                />
                <span className="flex-1 truncate text-sm text-muted-foreground">
                  {entry.name}
                </span>
                <span className="text-sm font-medium">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
