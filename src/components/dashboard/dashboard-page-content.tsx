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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
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
  if (price >= 1000000000) return `${(price / 1000000000).toFixed(1)} ty`;
  if (price >= 1000000) return `${(price / 1000000).toFixed(0)} trieu`;
  return price.toLocaleString("vi-VN");
}

const statusLabels: Record<string, string> = {
  PENDING: "Cho duyet",
  APPROVED: "Da duyet",
  DEPOSITED: "Da coc",
  CONTRACTED: "Da ky HD",
  COMPLETED: "Hoan thanh",
  CANCELLED: "Da huy",
};

const statusColors: Record<string, string> = {
  PENDING: "text-yellow-600",
  APPROVED: "text-blue-600",
  DEPOSITED: "text-purple-600",
  CONTRACTED: "text-cyan-600",
  COMPLETED: "text-green-600",
  CANCELLED: "text-red-600",
};

export function DashboardPageContent() {
  const [dateRange, setDateRange] = useState("30");

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: fetchDashboardStats,
  });

  const handleExportExcel = async () => {
    // Export to Excel functionality
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
    // Export to PDF functionality - simplified version
    window.print();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
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

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Tong quan hoat dong kinh doanh</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Chon thoi gian" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 ngay</SelectItem>
              <SelectItem value="30">30 ngay</SelectItem>
              <SelectItem value="90">90 ngay</SelectItem>
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
                Xuat Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDF}>
                <FileText className="h-4 w-4 mr-2" />
                Xuat PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Khach hang"
          value={stats.totalCustomers}
          icon={Users}
          trend={stats.customerTrend}
          trendLabel="so voi thang truoc"
          subtitle={`+${stats.currentMonthCustomers} thang nay`}
        />
        <KpiCard
          title="Booking dang xu ly"
          value={stats.activeBookings}
          icon={ShoppingCart}
          trend={stats.bookingTrend}
          trendLabel="so voi thang truoc"
          subtitle={`${stats.pendingBookings} cho duyet`}
        />
        <KpiCard
          title="Doanh thu"
          value={formatPrice(Number(stats.totalRevenue))}
          icon={DollarSign}
          trend={stats.revenueTrend}
          trendLabel="so voi thang truoc"
          valueColor="text-green-600"
          subtitle={`${stats.completedBookings} giao dich`}
        />
        <KpiCard
          title="Ty le chuyen doi"
          value={`${stats.conversionRate}%`}
          icon={TrendingUp}
          subtitle="Booking thanh cong / Tong KH"
          valueColor="text-blue-600"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SalesPerformanceChart days={parseInt(dateRange)} />
        </div>
        <TopPerformersLeaderboard />
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 md:grid-cols-2">
        <BookingStatusChart />
        <CustomerSourceChart />
      </div>

      {/* Recent Bookings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Booking gan day
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentBookings.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Chua co booking nao
            </p>
          ) : (
            <div className="space-y-4">
              {stats.recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <div>
                    <Link
                      href={`/bookings/${booking.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {booking.code}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {booking.customer.fullName} - {booking.property.code}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatPrice(Number(booking.agreedPrice))}</p>
                    <p className="text-xs">
                      <span className={statusColors[booking.status]}>
                        {statusLabels[booking.status]}
                      </span>
                      {" - "}
                      {format(new Date(booking.createdAt), "dd/MM/yyyy", { locale: vi })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link href="/bookings" className="block text-center mt-4">
            <span className="text-sm text-blue-600 hover:underline">
              Xem tat ca booking
            </span>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
