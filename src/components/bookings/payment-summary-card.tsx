"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface PaymentSummaryCardProps {
  agreedPrice: number;
  totalPaid: number;
  deposits: number;
  payments: number;
  refunds: number;
  commissionAmount: number;
  commissionRate: number;
}

function formatPrice(price: number): string {
  if (price >= 1000000000) {
    return `${(price / 1000000000).toFixed(2)} tỷ`;
  }
  if (price >= 1000000) {
    return `${(price / 1000000).toFixed(0)} triệu`;
  }
  return new Intl.NumberFormat("vi-VN").format(price) + " đ";
}

export function PaymentSummaryCard({
  agreedPrice,
  totalPaid,
  deposits,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  payments,
  refunds,
  commissionAmount,
  commissionRate,
}: PaymentSummaryCardProps) {
  const remaining = agreedPrice - totalPaid;
  const progressPercent = agreedPrice > 0 ? (totalPaid / agreedPrice) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tổng quan thanh toán</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm text-muted-foreground">Tiến độ thanh toán</span>
            <span className="text-sm font-medium">{progressPercent.toFixed(1)}%</span>
          </div>
          <Progress value={progressPercent} className="h-3" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-muted-foreground">Giá bán</p>
            <p className="text-lg font-bold">{formatPrice(agreedPrice)}</p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-muted-foreground">Đã thanh toán</p>
            <p className="text-lg font-bold text-green-600">{formatPrice(totalPaid)}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-muted-foreground">Tiền cọc</p>
            <p className="text-lg font-bold text-blue-600">{formatPrice(deposits)}</p>
          </div>
          <div className="p-3 bg-orange-50 rounded-lg">
            <p className="text-sm text-muted-foreground">Còn lại</p>
            <p className="text-lg font-bold text-orange-600">{formatPrice(remaining)}</p>
          </div>
        </div>

        {refunds > 0 && (
          <div className="p-3 bg-red-50 rounded-lg">
            <p className="text-sm text-muted-foreground">Đã hoàn tiền</p>
            <p className="text-lg font-bold text-red-600">-{formatPrice(refunds)}</p>
          </div>
        )}

        <div className="border-t pt-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Hoa hồng ({commissionRate}%)</p>
              <p className="text-lg font-bold text-purple-600">{formatPrice(commissionAmount)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
