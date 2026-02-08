"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  ArrowLeft,
  User,
  Home,
  Calendar,
  FileText,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { BookingStatusTimeline } from "@/components/bookings/booking-status-timeline";
import { TransactionList } from "@/components/bookings/transaction-list";
import { AddTransactionDialog } from "@/components/bookings/add-transaction-dialog";
import { UpdateStatusDialog } from "@/components/bookings/update-status-dialog";
import { PaymentSummaryCard } from "@/components/bookings/payment-summary-card";

async function fetchBooking(id: string) {
  const res = await fetch(`/api/bookings/${id}`);
  if (!res.ok) throw new Error("Failed to fetch booking");
  return res.json();
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-blue-100 text-blue-800",
  DEPOSITED: "bg-purple-100 text-purple-800",
  CONTRACTED: "bg-indigo-100 text-indigo-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  REFUNDED: "bg-orange-100 text-orange-800",
};

const statusLabels: Record<string, string> = {
  PENDING: "Cho duyet",
  APPROVED: "Da duyet",
  DEPOSITED: "Da coc",
  CONTRACTED: "Da ky HD",
  COMPLETED: "Hoan thanh",
  CANCELLED: "Da huy",
  REFUNDED: "Da hoan tien",
};

function formatPrice(price: number): string {
  if (price >= 1000000000) {
    return `${(price / 1000000000).toFixed(2)} ty`;
  }
  return `${(price / 1000000).toFixed(0)} trieu`;
}

export default function BookingDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: booking, isLoading } = useQuery({
    queryKey: ["booking", id],
    queryFn: () => fetchBooking(id),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-24" />
        <Skeleton className="h-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Khong tim thay booking</p>
        <Link href="/bookings">
          <Button variant="link">Quay lai</Button>
        </Link>
      </div>
    );
  }

  // Calculate payment summary from transactions
  const transactions = booking.transactions || [];
  const deposits = transactions
    .filter((t: { type: string; status: string }) => t.type === "DEPOSIT" && t.status === "CONFIRMED")
    .reduce((sum: number, t: { amount: number }) => sum + Number(t.amount), 0);
  const payments = transactions
    .filter((t: { type: string; status: string }) => t.type === "PAYMENT" && t.status === "CONFIRMED")
    .reduce((sum: number, t: { amount: number }) => sum + Number(t.amount), 0);
  const refunds = transactions
    .filter((t: { type: string; status: string }) => t.type === "REFUND" && t.status === "CONFIRMED")
    .reduce((sum: number, t: { amount: number }) => sum + Number(t.amount), 0);
  const totalPaid = deposits + payments - refunds;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/bookings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{booking.code}</h1>
              <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusColors[booking.status]}`}>
                {statusLabels[booking.status]}
              </span>
            </div>
            <p className="text-muted-foreground">
              Tao ngay {format(new Date(booking.createdAt), "dd/MM/yyyy HH:mm", { locale: vi })}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <UpdateStatusDialog bookingId={id} currentStatus={booking.status} />
          <AddTransactionDialog bookingId={id} bookingStatus={booking.status} />
        </div>
      </div>

      {/* Status Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Tien trinh booking</CardTitle>
        </CardHeader>
        <CardContent>
          <BookingStatusTimeline
            currentStatus={booking.status}
            bookingDate={booking.createdAt}
            depositDate={booking.depositDate}
            contractDate={booking.contractDate}
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Thong tin khach hang
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Ho ten</p>
                    <p className="font-medium">{booking.customer.fullName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{booking.customer.phone}</span>
                  </div>
                  {booking.customer.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{booking.customer.email}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  {booking.customer.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span>{booking.customer.address}</span>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Ma khach hang</p>
                    <p className="font-medium">{booking.customer.code}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Property Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Thong tin san pham
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Ma san pham</p>
                    <p className="font-medium">{booking.property.code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Du an</p>
                    <p className="font-medium">{booking.property.project.name}</p>
                  </div>
                  {booking.property.building && (
                    <div>
                      <p className="text-sm text-muted-foreground">Toa nha</p>
                      <p className="font-medium">{booking.property.building}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  {booking.property.floor && (
                    <div>
                      <p className="text-sm text-muted-foreground">Tang</p>
                      <p className="font-medium">{booking.property.floor}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Dien tich</p>
                    <p className="font-medium">{Number(booking.property.area)} m2</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gia niem yet</p>
                    <p className="font-medium">{formatPrice(Number(booking.property.price))}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contract Info */}
          {(booking.contractNumber || booking.contractDate) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Thong tin hop dong
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {booking.contractNumber && (
                    <div>
                      <p className="text-sm text-muted-foreground">So hop dong</p>
                      <p className="font-medium">{booking.contractNumber}</p>
                    </div>
                  )}
                  {booking.contractDate && (
                    <div>
                      <p className="text-sm text-muted-foreground">Ngay ky</p>
                      <p className="font-medium">
                        {format(new Date(booking.contractDate), "dd/MM/yyyy", { locale: vi })}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Transactions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Lich su giao dich
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionList transactions={transactions} />
            </CardContent>
          </Card>

          {/* Notes */}
          {booking.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Ghi chu</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{booking.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Summary */}
        <div className="space-y-6">
          <PaymentSummaryCard
            agreedPrice={Number(booking.agreedPrice)}
            totalPaid={totalPaid}
            deposits={deposits}
            payments={payments}
            refunds={refunds}
            commissionAmount={Number(booking.commissionAmount)}
            commissionRate={Number(booking.commissionRate)}
          />

          {/* Sales Info */}
          <Card>
            <CardHeader>
              <CardTitle>Nhan vien phu trach</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{booking.user.fullName}</p>
                  <p className="text-sm text-muted-foreground">{booking.user.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Important Dates */}
          <Card>
            <CardHeader>
              <CardTitle>Moc thoi gian</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Ngay tao</span>
                <span className="text-sm font-medium">
                  {format(new Date(booking.createdAt), "dd/MM/yyyy", { locale: vi })}
                </span>
              </div>
              {booking.depositDate && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Ngay coc</span>
                  <span className="text-sm font-medium">
                    {format(new Date(booking.depositDate), "dd/MM/yyyy", { locale: vi })}
                  </span>
                </div>
              )}
              {booking.contractDate && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Ngay ky HD</span>
                  <span className="text-sm font-medium">
                    {format(new Date(booking.contractDate), "dd/MM/yyyy", { locale: vi })}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Cap nhat</span>
                <span className="text-sm font-medium">
                  {format(new Date(booking.updatedAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
