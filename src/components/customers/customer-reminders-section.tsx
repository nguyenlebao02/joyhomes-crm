"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Plus, Check, Clock } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const reminderFormSchema = z.object({
  title: z.string().min(1, "Tiêu đề không được trống"),
  description: z.string().optional(),
  remindAt: z.string().min(1, "Chọn thời gian nhắc"),
});

type ReminderFormData = z.infer<typeof reminderFormSchema>;

interface Reminder {
  id: string;
  title: string;
  description?: string;
  remindAt: string;
  isCompleted: boolean;
  completedAt?: string;
}

interface CustomerRemindersSectionProps {
  customerId: string;
  reminders: Reminder[];
}

export function CustomerRemindersSection({ customerId, reminders }: CustomerRemindersSectionProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<ReminderFormData>({
    resolver: zodResolver(reminderFormSchema),
    defaultValues: { title: "", description: "", remindAt: "" },
  });

  const addMutation = useMutation({
    mutationFn: async (data: ReminderFormData) => {
      const res = await fetch(`/api/customers/${customerId}/reminders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          remindAt: new Date(data.remindAt).toISOString(),
        }),
      });
      if (!res.ok) throw new Error("Failed to add reminder");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer", customerId] });
      toast.success("Đã thêm nhắc lịch");
      form.reset();
      setOpen(false);
    },
    onError: () => {
      toast.error("Không thể thêm nhắc lịch");
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (reminderId: string) => {
      const res = await fetch(`/api/customers/${customerId}/reminders`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reminderId }),
      });
      if (!res.ok) throw new Error("Failed to complete reminder");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer", customerId] });
      toast.success("Đã hoàn thành nhắc lịch");
    },
    onError: () => {
      toast.error("Không thể cập nhật");
    },
  });

  const onSubmit = (data: ReminderFormData) => {
    addMutation.mutate(data);
  };

  const isPast = (date: string) => new Date(date) < new Date();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Nhắc lịch
        </CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="mr-1 h-4 w-4" />
              Thêm
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thêm nhắc lịch</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Tiêu đề</Label>
                <Input {...form.register("title")} placeholder="VD: Gọi điện tư vấn" />
                {form.formState.errors.title && (
                  <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Mô tả</Label>
                <Textarea {...form.register("description")} placeholder="Chi tiết..." rows={2} />
              </div>
              <div className="space-y-2">
                <Label>Thời gian nhắc</Label>
                <Input type="datetime-local" {...form.register("remindAt")} />
                {form.formState.errors.remindAt && (
                  <p className="text-sm text-destructive">{form.formState.errors.remindAt.message}</p>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit" disabled={addMutation.isPending}>
                  {addMutation.isPending ? "Đang lưu..." : "Lưu"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {reminders?.length > 0 ? (
          <div className="space-y-3">
            {reminders.map((reminder) => (
              <div
                key={reminder.id}
                className={`flex items-start gap-3 p-2 rounded-lg ${
                  reminder.isCompleted
                    ? "bg-green-50 dark:bg-green-950/20"
                    : isPast(reminder.remindAt)
                    ? "bg-red-50 dark:bg-red-950/20"
                    : "bg-muted/50"
                }`}
              >
                {reminder.isCompleted ? (
                  <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                ) : (
                  <Clock
                    className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                      isPast(reminder.remindAt) ? "text-red-500" : "text-yellow-500"
                    }`}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${reminder.isCompleted ? "line-through text-muted-foreground" : ""}`}>
                    {reminder.title}
                  </p>
                  {reminder.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{reminder.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(reminder.remindAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                  </p>
                </div>
                {!reminder.isCompleted && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2"
                    onClick={() => completeMutation.mutate(reminder.id)}
                    disabled={completeMutation.isPending}
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Không có nhắc lịch</p>
        )}
      </CardContent>
    </Card>
  );
}
