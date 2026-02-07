"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

const monthNames = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];

const statusLabels: Record<string, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  DEPOSITED: "Đã cọc",
  CONTRACTED: "Đã ký HĐ",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

const sourceLabels: Record<string, string> = {
  WEBSITE: "Website",
  REFERRAL: "Giới thiệu",
  SOCIAL_MEDIA: "Mạng XH",
  HOTLINE: "Hotline",
  EVENT: "Sự kiện",
  OTHER: "Khác",
  UNKNOWN: "Không rõ",
};

function formatPrice(price: number): string {
  if (price >= 1000000000) {
    return `${(price / 1000000000).toFixed(1)} tỷ`;
  }
  return `${(price / 1000000).toFixed(0)} tr`;
}

async function fetchReport(type: string, year?: number) {
  const params = new URLSearchParams({ type });
  if (year) params.set("year", year.toString());
  const res = await fetch(`/api/reports?${params}`);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export function ReportsPageContent() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  const { data: monthlyRevenue, isLoading: revenueLoading } = useQuery({
    queryKey: ["monthly-revenue", year],
    queryFn: () => fetchReport("monthly-revenue", year),
  });

  const { data: salesPerformance, isLoading: salesLoading } = useQuery({
    queryKey: ["sales-performance"],
    queryFn: () => fetchReport("sales-performance"),
  });

  const { data: bookingStatus } = useQuery({
    queryKey: ["booking-status"],
    queryFn: () => fetchReport("booking-status"),
  });

  const { data: customerSource } = useQuery({
    queryKey: ["customer-source"],
    queryFn: () => fetchReport("customer-source"),
  });

  const chartData = monthlyRevenue?.map((m: { month: number; revenue: number; count: number }) => ({
    name: monthNames[m.month - 1],
    revenue: m.revenue / 1000000000, // Convert to billions
    count: m.count,
  }));

  const statusData = bookingStatus?.map((s: { status: string; count: number }) => ({
    name: statusLabels[s.status] || s.status,
    value: s.count,
  }));

  const sourceData = customerSource?.map((s: { source: string; count: number }) => ({
    name: sourceLabels[s.source] || s.source,
    value: s.count,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Báo cáo</h1>
          <p className="text-muted-foreground">Phân tích dữ liệu kinh doanh</p>
        </div>
        <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
              <SelectItem key={y} value={y.toString()}>
                Năm {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Monthly Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Doanh thu theo tháng ({year})</CardTitle>
        </CardHeader>
        <CardContent>
          {revenueLoading ? (
            <Skeleton className="h-[300px]" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(v) => `${v} tỷ`} />
                <Tooltip
                  formatter={(value) => [`${Number(value).toFixed(2)} tỷ`, "Doanh thu"]}
                />
                <Bar dataKey="revenue" fill="#0088FE" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Pie Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Trạng thái Booking</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {statusData?.map((_: unknown, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nguồn khách hàng</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {sourceData?.map((_: unknown, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Sales Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Hiệu suất Sales</CardTitle>
        </CardHeader>
        <CardContent>
          {salesLoading ? (
            <Skeleton className="h-[200px]" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sales</TableHead>
                  <TableHead className="text-right">Số booking</TableHead>
                  <TableHead className="text-right">Doanh thu</TableHead>
                  <TableHead className="text-right">Hoa hồng</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesPerformance?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Chưa có dữ liệu
                    </TableCell>
                  </TableRow>
                ) : (
                  salesPerformance?.map((s: {
                    sales: { id: string; fullName: string };
                    bookingCount: number;
                    totalRevenue: number;
                    totalCommission: number;
                  }) => (
                    <TableRow key={s.sales.id}>
                      <TableCell className="font-medium">{s.sales.fullName}</TableCell>
                      <TableCell className="text-right">{s.bookingCount}</TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {formatPrice(Number(s.totalRevenue))}
                      </TableCell>
                      <TableCell className="text-right text-blue-600">
                        {formatPrice(Number(s.totalCommission))}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
