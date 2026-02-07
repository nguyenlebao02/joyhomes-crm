"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { MoreHorizontal, Eye, Edit, Trash2, Phone, Mail } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

interface Customer {
  id: string;
  code: string;
  fullName: string;
  phone: string;
  email?: string;
  status: string;
  source: string;
  priority: string;
  createdAt: string;
  user?: { fullName: string };
  _count?: { bookings: number; reminders: number; contacts: number };
}

interface CustomerDataTableProps {
  data: Customer[];
  isLoading: boolean;
  error: Error | null;
  pagination: {
    page: number;
    totalPages: number;
    total: number;
  };
}

const statusColors: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-800",
  CONTACTED: "bg-purple-100 text-purple-800",
  QUALIFIED: "bg-cyan-100 text-cyan-800",
  NEGOTIATING: "bg-yellow-100 text-yellow-800",
  WON: "bg-green-100 text-green-800",
  LOST: "bg-red-100 text-red-800",
  DORMANT: "bg-gray-100 text-gray-800",
};

const statusLabels: Record<string, string> = {
  NEW: "Mới",
  CONTACTED: "Đã liên hệ",
  QUALIFIED: "Đủ điều kiện",
  NEGOTIATING: "Đang đàm phán",
  WON: "Thành công",
  LOST: "Thất bại",
  DORMANT: "Ngưng HĐ",
};

const priorityColors: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-600",
  MEDIUM: "bg-blue-100 text-blue-600",
  HIGH: "bg-orange-100 text-orange-600",
  URGENT: "bg-red-100 text-red-600",
};

export function CustomerDataTable({ data, isLoading, error, pagination }: CustomerDataTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`/customers?${params.toString()}`);
  };

  if (error) {
    return (
      <div className="rounded-md border p-8 text-center text-muted-foreground">
        Có lỗi xảy ra khi tải dữ liệu
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã KH</TableHead>
              <TableHead>Họ tên</TableHead>
              <TableHead>Liên hệ</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Ưu tiên</TableHead>
              <TableHead>Nhân viên</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  Không có khách hàng nào
                </TableCell>
              </TableRow>
            ) : (
              data.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.code}</TableCell>
                  <TableCell>
                    <Link
                      href={`/customers/${customer.id}`}
                      className="font-medium hover:underline"
                    >
                      {customer.fullName}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="h-3 w-3" />
                        {customer.phone}
                      </div>
                      {customer.email && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {customer.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${statusColors[customer.status]}`}
                    >
                      {statusLabels[customer.status]}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${priorityColors[customer.priority]}`}
                    >
                      {customer.priority}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {customer.user?.fullName || "-"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(customer.createdAt), "dd/MM/yyyy", { locale: vi })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/customers/${customer.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Xem chi tiết
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/customers/${customer.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Chỉnh sửa
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Xóa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Hiển thị {data.length} / {pagination.total} khách hàng
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
          >
            Trước
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
          >
            Sau
          </Button>
        </div>
      </div>
    </div>
  );
}
