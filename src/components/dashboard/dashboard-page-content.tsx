"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Users,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  AlertCircle,
  Flame,
  ClipboardList,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentUser } from "@/hooks/use-current-user";
import { KpiCard } from "./kpi-card";
import { SalesPerformanceChart } from "./sales-performance-chart";
import { BookingStatusChart } from "./booking-status-chart";
import { CustomerSourceChart } from "./customer-source-chart";
import { TopPerformersLeaderboard } from "./top-performers-leaderboard";

interface DashboardStats {
  totalCustomers: number;
  totalProjects: number;
  totalBookings: number;
  activeBookings: number;
  pendingBookings: number;
  completedBookings: number;
  totalRevenue: number;
  totalCommission: number;
  customerTrend: number;
  bookingTrend: number;
  revenueTrend: number;
  conversionRate: number;
  currentMonthCustomers: number;
  currentMonthBookings: number;
  currentMonthRevenue: number;
  recentBookings: {
    id: string;
    code: string;
    status: string;
    agreedPrice: number;
    createdAt: string;
    customer: { fullName: string };
    property: { code: string; project: { name: string } };
  }[];
}

async function fetchDashboardStats() {
  const res = await fetch("/api/reports?type=dashboard");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

function formatPrice(price: number): string {
  if (price >= 1000000000) return `${(price / 1000000000).toFixed(1)} tỷ`;
  if (price >= 1000000) return `${(price / 1000000).toFixed(0)} triệu`;
  return price.toLocaleString("vi-VN");
}

const statusLabels: Record<string, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  DEPOSITED: "Đã cọc",
  CONTRACTED: "Đã ký HĐ",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

const statusBadgeVariants: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  APPROVED: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  DEPOSITED: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400",
  CONTRACTED: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-400",
  COMPLETED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Chào buổi sáng";
  if (hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

export function DashboardPageContent() {
  const [dateRange, setDateRange] = useState("30");
  const { user } = useCurrentUser();

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: fetchDashboardStats,
  });

  const handleExportExcel = async () => {
    const data = {
      stats,
      exportDate: new Date().toISOString(),
      type: "dashboard-report",
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dashboard-report-${format(new Date(), "yyyy-MM-dd")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = async () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-1">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!stats) return null;

  const displayName = user?.fullName || user?.name || "bạn";

  return (
    <div className="space-y-6 p-1">
      {/* Greeting header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" suppressHydrationWarning>
            {getGreeting()}, {displayName}
          </h1>
          <p className="text-muted-foreground" suppressHydrationWarning>
            Tổng quan hoạt động kinh doanh — {format(new Date(), "EEEE, dd/MM/yyyy", { locale: vi })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Chọn thời gian" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 ngày</SelectItem>
              <SelectItem value="30">30 ngày</SelectItem>
              <SelectItem value="90">90 ngày</SelectItem>
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Download className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportExcel}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Xuất Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDF}>
                <FileText className="h-4 w-4 mr-2" />
                Xuất PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Khách hàng"
          value={stats.totalCustomers}
          icon={Users}
          trend={stats.customerTrend}
          trendLabel="so với tháng trước"
          subtitle={`+${stats.currentMonthCustomers} tháng này`}
          accentColor="border-l-primary"
          iconColor="text-primary"
        />
        <KpiCard
          title="Booking đang xử lý"
          value={stats.activeBookings}
          icon={ShoppingCart}
          trend={stats.bookingTrend}
          trendLabel="so với tháng trước"
          subtitle={`${stats.pendingBookings} chờ duyệt`}
          accentColor="border-l-amber-500"
          iconColor="text-amber-600 dark:text-amber-400"
        />
        <KpiCard
          title="Doanh thu"
          value={formatPrice(Number(stats.totalRevenue))}
          icon={DollarSign}
          trend={stats.revenueTrend}
          trendLabel="so với tháng trước"
          subtitle={`${stats.completedBookings} giao dịch`}
          accentColor="border-l-emerald-500"
          iconColor="text-emerald-600 dark:text-emerald-400"
          valueColor="text-emerald-600 dark:text-emerald-400"
        />
        <KpiCard
          title="Tỷ lệ chuyển đổi"
          value={`${stats.conversionRate}%`}
          icon={TrendingUp}
          subtitle="Booking thành công / Tổng KH"
          accentColor="border-l-sky-600"
          iconColor="text-sky-600 dark:text-sky-400"
          valueColor="text-sky-600 dark:text-sky-400"
        />
      </div>

      {/* Action required row */}
      <div className="grid gap-3 md:grid-cols-3">
        <Card className="bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/50">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-medium">Booking chờ duyệt</p>
              <p className="text-xl font-bold text-amber-700 dark:text-amber-400">
                {stats.pendingBookings}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-50/50 border-red-200 dark:bg-red-950/20 dark:border-red-900/50">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/40">
              <Flame className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm font-medium">KH mới tháng này</p>
              <p className="text-xl font-bold text-red-700 dark:text-red-400">
                {stats.currentMonthCustomers}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50/50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/50">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40">
              <ClipboardList className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium">Booking tháng này</p>
              <p className="text-xl font-bold text-blue-700 dark:text-blue-400">
                {stats.currentMonthBookings}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1: Sales + Leaderboard (2:1) */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SalesPerformanceChart days={parseInt(dateRange)} />
        </div>
        <TopPerformersLeaderboard />
      </div>

      {/* Charts Row 2: Booking status + Customer source (1:1) */}
      <div className="grid gap-4 md:grid-cols-2">
        <BookingStatusChart />
        <CustomerSourceChart />
      </div>

      {/* Recent Bookings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Booking gần đây
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentBookings.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Chưa có booking nào
            </p>
          ) : (
            <div className="space-y-3">
              {stats.recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/30"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/bookings/${booking.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {booking.code}
                    </Link>
                    <p className="text-sm text-muted-foreground truncate">
                      {booking.customer.fullName} — {booking.property.code}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge
                      variant="secondary"
                      className={`text-xs ${statusBadgeVariants[booking.status] || ""}`}
                    >
                      {statusLabels[booking.status] || booking.status}
                    </Badge>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {formatPrice(Number(booking.agreedPrice))}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(booking.createdAt), "dd/MM/yyyy", { locale: vi })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link href="/bookings" className="block text-center mt-4">
            <Button variant="ghost" size="sm" className="text-primary">
              Xem tất cả booking
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
