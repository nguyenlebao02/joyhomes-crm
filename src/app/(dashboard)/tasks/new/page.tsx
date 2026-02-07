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
import { taskCreateSchema, type TaskCreateInput } from "@/lib/validators/task-event-validation-schema";

async function fetchUsers() {
  const res = await fetch("/api/users");
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

async function fetchCustomers() {
  const res = await fetch("/api/customers?limit=100");
  if (!res.ok) throw new Error("Failed to fetch customers");
  return res.json();
}

export default function NewTaskPage() {
  const router = useRouter();

  const { data: users } = useQuery({
    queryKey: ["users-select"],
    queryFn: fetchUsers,
  });

  const { data: customersData } = useQuery({
    queryKey: ["customers-select"],
    queryFn: fetchCustomers,
  });

  const customers = customersData?.customers || [];

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<TaskCreateInput>({
    resolver: zodResolver(taskCreateSchema) as never,
    defaultValues: {
      priority: "MEDIUM",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: TaskCreateInput) => {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create task");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Tạo task thành công");
      router.push("/tasks");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const onSubmit = (data: TaskCreateInput) => {
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/tasks">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Tạo task mới</h1>
          <p className="text-muted-foreground">Thêm công việc cần thực hiện</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Task Info */}
        <Card>
          <CardHeader>
            <CardTitle>Thông tin task</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tiêu đề *</Label>
              <Input
                placeholder="Nhập tiêu đề task"
                {...register("title")}
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Textarea
                placeholder="Mô tả chi tiết công việc..."
                {...register("description")}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Độ ưu tiên</Label>
                <Select onValueChange={(value) => setValue("priority", value as TaskCreateInput["priority"])} defaultValue="MEDIUM">
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn độ ưu tiên" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Thấp</SelectItem>
                    <SelectItem value="MEDIUM">Trung bình</SelectItem>
                    <SelectItem value="HIGH">Cao</SelectItem>
                    <SelectItem value="URGENT">Khẩn cấp</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Hạn hoàn thành</Label>
                <Input
                  type="datetime-local"
                  {...register("dueDate")}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assignment */}
        <Card>
          <CardHeader>
            <CardTitle>Phân công</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Giao cho</Label>
              <Select onValueChange={(value) => setValue("assigneeId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn người thực hiện" />
                </SelectTrigger>
                <SelectContent>
                  {users?.map((u: { id: string; fullName: string; email: string }) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.fullName} ({u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Khách hàng liên quan</Label>
              <Select onValueChange={(value) => setValue("customerId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn khách hàng (không bắt buộc)" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c: { id: string; fullName: string; phone: string }) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.fullName} - {c.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Link href="/tasks">
            <Button type="button" variant="outline">
              Hủy
            </Button>
          </Link>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Đang tạo..." : "Tạo task"}
          </Button>
        </div>
      </form>
    </div>
  );
}
