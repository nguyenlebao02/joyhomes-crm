"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddTransactionDialogProps {
  bookingId: string;
  bookingStatus: string;
}

const transactionTypes = [
  { value: "add_deposit", label: "Đặt cọc", allowedStatuses: ["APPROVED", "DEPOSITED"] },
  { value: "add_payment", label: "Thanh toán", allowedStatuses: ["DEPOSITED", "CONTRACTED"] },
  { value: "add_refund", label: "Hoàn tiền", allowedStatuses: ["DEPOSITED", "CONTRACTED", "CANCELLED"] },
];

const paymentMethods = [
  { value: "BANK_TRANSFER", label: "Chuyển khoản" },
  { value: "CASH", label: "Tiền mặt" },
  { value: "CARD", label: "Thẻ" },
  { value: "OTHER", label: "Khác" },
];

export function AddTransactionDialog({ bookingId, bookingStatus }: AddTransactionDialogProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
  const [notes, setNotes] = useState("");
  const queryClient = useQueryClient();

  const availableTypes = transactionTypes.filter((t) =>
    t.allowedStatuses.includes(bookingStatus)
  );

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: type,
          amount: Number(amount),
          paymentMethod,
          notes,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Thêm giao dịch thất bại");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Thêm giao dịch thành công");
      queryClient.invalidateQueries({ queryKey: ["booking", bookingId] });
      setOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setType("");
    setAmount("");
    setPaymentMethod("BANK_TRANSFER");
    setNotes("");
  };

  if (availableTypes.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Thêm giao dịch
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm giao dịch mới</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Loại giao dịch *</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn loại giao dịch" />
              </SelectTrigger>
              <SelectContent>
                {availableTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Số tiền (VNĐ) *</Label>
            <Input
              type="number"
              placeholder="Nhập số tiền"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Phương thức thanh toán</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Ghi chú</Label>
            <Textarea
              placeholder="Ghi chú về giao dịch..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={() => mutation.mutate()}
              disabled={!type || !amount || mutation.isPending}
            >
              {mutation.isPending ? "Đang xử lý..." : "Thêm giao dịch"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
