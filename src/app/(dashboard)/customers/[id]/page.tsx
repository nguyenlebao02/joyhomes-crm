"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  ArrowLeft,
  Edit,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { CustomerContactHistory } from "@/components/customers/customer-contact-history";
import { CustomerNotesSection } from "@/components/customers/customer-notes-section";
import { CustomerRemindersSection } from "@/components/customers/customer-reminders-section";
import { CustomerInterestsSection } from "@/components/customers/customer-interests-section";
import { PropertyRecommendations } from "@/components/recommendations/property-recommendations";
import { CrossSellSuggestions } from "@/components/recommendations/cross-sell-suggestions";

async function fetchCustomer(id: string) {
  const res = await fetch(`/api/customers/${id}`);
  if (!res.ok) throw new Error("Failed to fetch customer");
  return res.json();
}

const statusLabels: Record<string, string> = {
  NEW: "Mới",
  CONTACTED: "Đã liên hệ",
  QUALIFIED: "Đủ điều kiện",
  NEGOTIATING: "Đang đàm phán",
  WON: "Thành công",
  LOST: "Thất bại",
  DORMANT: "Ngưng HĐ",
};

export default function CustomerDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: customer, isLoading, error } = useQuery({
    queryKey: ["customer", id],
    queryFn: () => fetchCustomer(id),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-64 md:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Không tìm thấy khách hàng</p>
        <Link href="/customers">
          <Button variant="link">Quay lại danh sách</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/customers">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{customer.fullName}</h1>
              <span className="text-sm text-muted-foreground">({customer.code})</span>
            </div>
            <p className="text-muted-foreground">{statusLabels[customer.status]}</p>
          </div>
        </div>
        <Link href={`/customers/${id}/edit`}>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Chỉnh sửa
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Info */}
        <div className="space-y-6 md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin liên hệ</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Điện thoại</p>
                  <p className="font-medium">{customer.phone}</p>
                </div>
              </div>
              {customer.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{customer.email}</p>
                  </div>
                </div>
              )}
              {customer.address && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Địa chỉ</p>
                    <p className="font-medium">{customer.address}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Nhân viên phụ trách</p>
                  <p className="font-medium">{customer.user?.fullName || "-"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Ngày tạo</p>
                  <p className="font-medium">
                    {format(new Date(customer.createdAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact History */}
          <CustomerContactHistory customerId={id} contacts={customer.contacts || []} />

          {/* Notes */}
          <CustomerNotesSection customerId={id} notes={customer.notes || []} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Reminders */}
          <CustomerRemindersSection customerId={id} reminders={customer.reminders || []} />

          {/* Interests */}
          <CustomerInterestsSection customerId={id} interests={customer.interests || []} />

          {/* AI Recommendations */}
          <PropertyRecommendations customerId={id} />

          {/* Cross-sell Suggestions */}
          <CrossSellSuggestions customerId={id} />

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Thống kê</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Lượt liên hệ</span>
                <span className="font-medium">{customer._count?.contacts || 0}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Booking</span>
                <span className="font-medium">{customer._count?.bookings || 0}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Nhắc lịch</span>
                <span className="font-medium">{customer._count?.reminders || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
