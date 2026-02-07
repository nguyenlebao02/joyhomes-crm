"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { StickyNote, Plus } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const noteFormSchema = z.object({
  content: z.string().min(1, "Nội dung không được trống"),
});

type NoteFormData = z.infer<typeof noteFormSchema>;

interface Note {
  id: string;
  content: string;
  createdAt: string;
}

interface CustomerNotesSectionProps {
  customerId: string;
  notes: Note[];
}

export function CustomerNotesSection({ customerId, notes }: CustomerNotesSectionProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<NoteFormData>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: { content: "" },
  });

  const mutation = useMutation({
    mutationFn: async (data: NoteFormData) => {
      const res = await fetch(`/api/customers/${customerId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to add note");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer", customerId] });
      toast.success("Đã thêm ghi chú");
      form.reset();
      setOpen(false);
    },
    onError: () => {
      toast.error("Không thể thêm ghi chú");
    },
  });

  const onSubmit = (data: NoteFormData) => {
    mutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <StickyNote className="h-5 w-5" />
          Ghi chú
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
              <DialogTitle>Thêm ghi chú</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Nội dung</Label>
                <Textarea
                  {...form.register("content")}
                  placeholder="Nhập ghi chú..."
                  rows={4}
                />
                {form.formState.errors.content && (
                  <p className="text-sm text-destructive">{form.formState.errors.content.message}</p>
                )}
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
        {notes?.length > 0 ? (
          <div className="space-y-3">
            {notes.map((note) => (
              <div key={note.id} className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {format(new Date(note.createdAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Chưa có ghi chú</p>
        )}
      </CardContent>
    </Card>
  );
}
