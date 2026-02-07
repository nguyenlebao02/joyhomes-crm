"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Plus, Phone, Mail, Video, Users } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const contactFormSchema = z.object({
  type: z.enum(["CALL", "SMS", "EMAIL", "ZALO", "FACEBOOK", "MEETING", "SITE_VISIT"]),
  content: z.string().min(1, "Nội dung không được trống"),
  result: z.string().optional(),
  nextAction: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

interface Contact {
  id: string;
  type: string;
  content: string;
  result?: string;
  nextAction?: string;
  createdAt: string;
}

interface CustomerContactHistoryProps {
  customerId: string;
  contacts: Contact[];
}

const contactTypeLabels: Record<string, { label: string; icon: React.ReactNode }> = {
  CALL: { label: "Gọi điện", icon: <Phone className="h-4 w-4" /> },
  SMS: { label: "SMS", icon: <MessageSquare className="h-4 w-4" /> },
  EMAIL: { label: "Email", icon: <Mail className="h-4 w-4" /> },
  ZALO: { label: "Zalo", icon: <MessageSquare className="h-4 w-4" /> },
  FACEBOOK: { label: "Facebook", icon: <MessageSquare className="h-4 w-4" /> },
  MEETING: { label: "Họp mặt", icon: <Users className="h-4 w-4" /> },
  SITE_VISIT: { label: "Thăm dự án", icon: <Video className="h-4 w-4" /> },
};

export function CustomerContactHistory({ customerId, contacts }: CustomerContactHistoryProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      type: "CALL",
      content: "",
      result: "",
      nextAction: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      const res = await fetch(`/api/customers/${customerId}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to add contact");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer", customerId] });
      toast.success("Đã thêm lịch sử liên hệ");
      form.reset();
      setOpen(false);
    },
    onError: () => {
      toast.error("Không thể thêm liên hệ");
    },
  });

  const onSubmit = (data: ContactFormData) => {
    mutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Lịch sử liên hệ
        </CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" />
              Thêm
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thêm lịch sử liên hệ</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Loại liên hệ</Label>
                <Select
                  value={form.watch("type")}
                  onValueChange={(v) => form.setValue("type", v as ContactFormData["type"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(contactTypeLabels).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nội dung</Label>
                <Textarea
                  {...form.register("content")}
                  placeholder="Nội dung cuộc liên hệ..."
                />
                {form.formState.errors.content && (
                  <p className="text-sm text-destructive">{form.formState.errors.content.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Kết quả</Label>
                <Input {...form.register("result")} placeholder="Kết quả cuộc liên hệ" />
              </div>
              <div className="space-y-2">
                <Label>Hành động tiếp theo</Label>
                <Input {...form.register("nextAction")} placeholder="Việc cần làm tiếp" />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? "Đang lưu..." : "Lưu"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {contacts?.length > 0 ? (
          <div className="space-y-4">
            {contacts.map((contact) => (
              <div key={contact.id} className="border-l-2 border-primary pl-4 py-2">
                <div className="flex items-center gap-2">
                  {contactTypeLabels[contact.type]?.icon}
                  <span className="text-sm font-medium">
                    {contactTypeLabels[contact.type]?.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(contact.createdAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                  </span>
                </div>
                <p className="text-sm mt-1">{contact.content}</p>
                {contact.result && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Kết quả: {contact.result}
                  </p>
                )}
                {contact.nextAction && (
                  <p className="text-sm text-blue-600 mt-1">
                    Tiếp theo: {contact.nextAction}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Chưa có lịch sử liên hệ</p>
        )}
      </CardContent>
    </Card>
  );
}
