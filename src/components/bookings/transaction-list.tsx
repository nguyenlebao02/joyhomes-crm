"use client";

import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { ArrowDownCircle, ArrowUpCircle, RefreshCw, Banknote } from "lucide-react";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  code: string;
  type: string;
  amount: number;
  paymentMethod?: string;
  paymentDate?: string;
  status: string;
  notes?: string;
  createdAt: string;
}

interface TransactionListProps {
  transactions: Transaction[];
}

const typeConfig: Record<string, { icon: typeof ArrowDownCircle; color: string; label: string }> = {
  DEPOSIT: { icon: ArrowDownCircle, color: "text-green-600", label: "Đặt cọc" },
  PAYMENT: { icon: Banknote, color: "text-blue-600", label: "Thanh toán" },
  REFUND: { icon: ArrowUpCircle, color: "text-red-600", label: "Hoàn tiền" },
  COMMISSION: { icon: RefreshCw, color: "text-purple-600", label: "Hoa hồng" },
};

const paymentMethodLabels: Record<string, string> = {
  CASH: "Tiền mặt",
  BANK_TRANSFER: "Chuyển khoản",
  CARD: "Thẻ",
  OTHER: "Khác",
};

function formatPrice(price: number): string {
  if (price >= 1000000000) {
    return `${(price / 1000000000).toFixed(2)} tỷ`;
  }
  if (price >= 1000000) {
    return `${(price / 1000000).toFixed(0)} triệu`;
  }
  return new Intl.NumberFormat("vi-VN").format(price) + " đ";
}

export function TransactionList({ transactions }: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Chưa có giao dịch nào
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((tx) => {
        const config = typeConfig[tx.type] || typeConfig.PAYMENT;
        const Icon = config.icon;
        const isRefund = tx.type === "REFUND";
        const isCancelled = tx.status === "CANCELLED";

        return (
          <div
            key={tx.id}
            className={cn(
              "flex items-center justify-between p-4 rounded-lg border",
              isCancelled && "opacity-50 bg-gray-50"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-full bg-gray-100", config.color)}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{config.label}</p>
                  {isCancelled && (
                    <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">
                      Đã hủy
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {tx.code} • {paymentMethodLabels[tx.paymentMethod || ""] || ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(tx.createdAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                </p>
              </div>
            </div>
            <p
              className={cn(
                "font-semibold text-lg",
                isRefund ? "text-red-600" : "text-green-600",
                isCancelled && "line-through"
              )}
            >
              {isRefund ? "-" : "+"}{formatPrice(Number(tx.amount))}
            </p>
          </div>
        );
      })}
    </div>
  );
}
