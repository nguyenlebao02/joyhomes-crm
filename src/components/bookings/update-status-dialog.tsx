"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
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

interface UpdateStatusDialogProps {
  bookingId: string;
  currentStatus: string;
}

const statusConfig: Record<string, { label: string; color: string; nextStatuses: string[] }> = {
  PENDING: { label: "Chờ duyệt", color: "yellow", nextStatuses: ["APPROVED", "CANCELLED"] },
  APPROVED: { label: "Đã duyệt", color: "blue", nextStatuses: ["DEPOSITED", "CANCELLED"] },
  DEPOSITED: { label: "Đã cọc", color: "purple", nextStatuses: ["CONTRACTED", "CANCELLED", "REFUNDED"] },
  CONTRACTED: { label: "Đã ký HĐ", color: "indigo", nextStatuses: ["COMPLETED", "CANCELLED", "REFUNDED"] },
  COMPLETED: { label: "Hoàn thành", color: "green", nextStatuses: [] },
  CANCELLED: { label: "Đã hủy", color: "red", nextStatuses: [] },
  REFUNDED: { label: "Đã hoàn tiền", color: "orange", nextStatuses: [] },
};

const statusLabels: Record<string, string> = {
  APPROVED: "Duyệt booking",
  DEPOSITED: "Xác nhận đặt cọc",
  CONTRACTED: "Ký hợp đồng",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Hủy booking",
  REFUNDED: "Hoàn tiền",
};

export function UpdateStatusDialog({ bookingId, currentStatus }: UpdateStatusDialogProps) {
  const [open, setOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [contractNumber, setContractNumber] = useState("");
  const [notes, setNotes] = useState("");
  const queryClient = useQueryClient();

  const config = statusConfig[currentStatus];
  const nextStatuses = config?.nextStatuses || [];

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_status",
          status: newStatus,
          contractNumber: newStatus === "CONTRACTED" ? contractNumber : undefined,
          notes,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Cập nhật trạng thái thất bại");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Cập nhật trạng thái thành công");
      queryClient.invalidateQueries({ queryKey: ["booking", bookingId] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      setOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setNewStatus("");
    setContractNumber("");
    setNotes("");
  };

  if (nextStatuses.length === 0) {
    return null;
  }

  const requiresReason = newStatus === "CANCELLED" || newStatus === "REFUNDED";
  const requiresContract = newStatus === "CONTRACTED";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <ArrowRight className="mr-2 h-4 w-4" />
          Chuyển trạng thái
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chuyển trạng thái booking</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-muted-foreground">Trạng thái hiện tại</p>
            <p className="font-medium">{config?.label}</p>
          </div>

          <div className="space-y-2">
            <Label>Trạng thái mới *</Label>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                {nextStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {statusLabels[status] || status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {requiresContract && (
            <div className="space-y-2">
              <Label>Số hợp đồng *</Label>
              <Input
                placeholder="Nhập số hợp đồng"
                value={contractNumber}
                onChange={(e) => setContractNumber(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>{requiresReason ? "Lý do *" : "Ghi chú"}</Label>
            <Textarea
              placeholder={requiresReason ? "Nhập lý do..." : "Ghi chú thêm..."}
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
              disabled={
                !newStatus ||
                (requiresReason && !notes) ||
                (requiresContract && !contractNumber) ||
                mutation.isPending
              }
              variant={newStatus === "CANCELLED" || newStatus === "REFUNDED" ? "destructive" : "default"}
            >
              {mutation.isPending ? "Đang xử lý..." : "Xác nhận"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
