"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { Plus, Search, FileText } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface Booking {
  id: string;
  code: string;
  status: string;
  agreedPrice: number;
  depositAmount: number;
  createdAt: string;
  customer: { id: string; fullName: string; phone: string };
  property: {
    id: string;
    code: string;
    building?: string;
    floor?: number;
    project: { id: string; name: string; code: string };
  };
  user: { id: string; fullName: string };
}

interface BookingStats {
  total: number;
  pending: number;
  approved: number;
  deposited: number;
  contracted: number;
  completed: number;
  cancelled: number;
  revenue: number;
  commission: number;
}

async function fetchBookings(search?: string, status?: string) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (status && status !== "all") params.set("status", status);
  const res = await fetch(`/api/bookings?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch bookings");
  return res.json();
}

async function fetchStats() {
  const res = await fetch("/api/bookings?stats=true");
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-blue-100 text-blue-800",
  DEPOSITED: "bg-purple-100 text-purple-800",
  CONTRACTED: "bg-indigo-100 text-indigo-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const statusLabels: Record<string, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  DEPOSITED: "Đã cọc",
  CONTRACTED: "Đã ký HĐ",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

function formatPrice(price: number): string {
  if (price >= 1000000000) {
    return `${(price / 1000000000).toFixed(1)} tỷ`;
  }
  return `${(price / 1000000).toFixed(0)} triệu`;
}

export function BookingsPageContent() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["bookings", search, status],
    queryFn: () => fetchBookings(search, status),
  });

  const { data: stats } = useQuery<BookingStats>({
    queryKey: ["booking-stats"],
    queryFn: fetchStats,
  });

  const bookings: Booking[] = data?.bookings || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản lý Booking</h1>
          <p className="text-muted-foreground">Theo dõi và quản lý các giao dịch đặt chỗ</p>
        </div>
        <Link href="/bookings/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Tạo booking
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tổng booking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Chờ duyệt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Doanh thu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{formatPrice(stats.revenue)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Hoa hồng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">{formatPrice(stats.commission)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm booking..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="PENDING">Chờ duyệt</SelectItem>
            <SelectItem value="APPROVED">Đã duyệt</SelectItem>
            <SelectItem value="DEPOSITED">Đã cọc</SelectItem>
            <SelectItem value="CONTRACTED">Đã ký HĐ</SelectItem>
            <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
            <SelectItem value="CANCELLED">Đã hủy</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bookings Table */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Chưa có booking nào</p>
            <Link href="/bookings/new">
              <Button className="mt-4">Tạo booking đầu tiên</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã booking</TableHead>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Sản phẩm</TableHead>
                <TableHead>Giá bán</TableHead>
                <TableHead>Đã cọc</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày tạo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell>
                    <Link
                      href={`/bookings/${booking.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {booking.code}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{booking.customer.fullName}</p>
                      <p className="text-sm text-muted-foreground">{booking.customer.phone}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{booking.property.code}</p>
                      <p className="text-sm text-muted-foreground">
                        {booking.property.project.name}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{formatPrice(Number(booking.agreedPrice))}</TableCell>
                  <TableCell>{formatPrice(Number(booking.depositAmount))}</TableCell>
                  <TableCell>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${statusColors[booking.status]}`}
                    >
                      {statusLabels[booking.status]}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(booking.createdAt), "dd/MM/yyyy", { locale: vi })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
