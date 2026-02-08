"use client";

import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { eventCreateSchema, type EventCreateInput } from "@/lib/validators/task-event-validation-schema";

async function fetchProjects() {
  const res = await fetch("/api/inventory/projects");
  if (!res.ok) throw new Error("Failed to fetch projects");
  return res.json();
}

export default function NewEventPage() {
  const router = useRouter();

  const { data: projects } = useQuery({
    queryKey: ["projects-select"],
    queryFn: fetchProjects,
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<EventCreateInput>({
    resolver: zodResolver(eventCreateSchema) as never,
    defaultValues: {
      type: "MEETING",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: EventCreateInput) => {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create event");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Tạo sự kiện thành công");
      router.push("/events");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const onSubmit = (data: EventCreateInput) => {
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/events">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Tạo sự kiện mới</h1>
          <p className="text-muted-foreground">Lên lịch sự kiện hoặc cuộc họp</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Event Info */}
        <Card>
          <CardHeader>
            <CardTitle>Thông tin sự kiện</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tiêu đề *</Label>
              <Input
                placeholder="Nhập tiêu đề sự kiện"
                {...register("title")}
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Loại sự kiện</Label>
              <Select onValueChange={(value) => setValue("type", value as EventCreateInput["type"])} defaultValue="MEETING">
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại sự kiện" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEETING">Họp</SelectItem>
                  <SelectItem value="KICKOFF">Kickoff</SelectItem>
                  <SelectItem value="GROUNDBREAKING">Khởi công</SelectItem>
                  <SelectItem value="OPENING">Mở bán</SelectItem>
                  <SelectItem value="TALK_SHOW">Talk show</SelectItem>
                  <SelectItem value="TRAINING">Đào tạo</SelectItem>
                  <SelectItem value="OTHER">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Textarea
                placeholder="Mô tả chi tiết về sự kiện..."
                {...register("description")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Time & Location */}
        <Card>
          <CardHeader>
            <CardTitle>Thời gian & Địa điểm</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Thời gian bắt đầu *</Label>
                <Input
                  type="datetime-local"
                  {...register("startDate")}
                />
                {errors.startDate && (
                  <p className="text-sm text-red-500">{errors.startDate.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Thời gian kết thúc</Label>
                <Input
                  type="datetime-local"
                  {...register("endDate")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Địa điểm</Label>
              <Input
                placeholder="Nhập địa điểm tổ chức"
                {...register("location")}
              />
            </div>

            <div className="space-y-2">
              <Label>Dự án liên quan</Label>
              <Select onValueChange={(value) => setValue("projectId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn dự án (không bắt buộc)" />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map((p: { id: string; name: string; code: string }) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Link href="/events">
            <Button type="button" variant="outline">
              Hủy
            </Button>
          </Link>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Đang tạo..." : "Tạo sự kiện"}
          </Button>
        </div>
      </form>
    </div>
  );
}
