"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  customerCreateSchema,
  CustomerCreateInput,
} from "@/lib/validators/customer-validation-schema";

interface CustomerFormProps {
  defaultValues?: Partial<CustomerCreateInput>;
  customerId?: string;
  mode: "create" | "edit";
}

const sourceOptions = [
  { value: "FACEBOOK", label: "Facebook" },
  { value: "GOOGLE", label: "Google" },
  { value: "ZALO", label: "Zalo" },
  { value: "REFERRAL", label: "Giới thiệu" },
  { value: "WALK_IN", label: "Tự đến" },
  { value: "EVENT", label: "Sự kiện" },
  { value: "HOTLINE", label: "Hotline" },
  { value: "WEBSITE", label: "Website" },
  { value: "OTHER", label: "Khác" },
];

const statusOptions = [
  { value: "NEW", label: "Mới" },
  { value: "CONTACTED", label: "Đã liên hệ" },
  { value: "QUALIFIED", label: "Đủ điều kiện" },
  { value: "NEGOTIATING", label: "Đang đàm phán" },
  { value: "WON", label: "Thành công" },
  { value: "LOST", label: "Thất bại" },
  { value: "DORMANT", label: "Ngưng hoạt động" },
];

const priorityOptions = [
  { value: "LOW", label: "Thấp" },
  { value: "MEDIUM", label: "Trung bình" },
  { value: "HIGH", label: "Cao" },
  { value: "URGENT", label: "Khẩn cấp" },
];

const genderOptions = [
  { value: "MALE", label: "Nam" },
  { value: "FEMALE", label: "Nữ" },
  { value: "OTHER", label: "Khác" },
];

export function CustomerFormComponent({ defaultValues, customerId, mode }: CustomerFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CustomerCreateInput>({
    resolver: zodResolver(customerCreateSchema) as any,
    defaultValues: {
      source: "OTHER",
      status: "NEW",
      priority: "MEDIUM",
      ...defaultValues,
    },
  });

  const onSubmit = async (data: CustomerCreateInput) => {
    setIsSubmitting(true);
    try {
      const url = mode === "create" ? "/api/customers" : `/api/customers/${customerId}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Có lỗi xảy ra");
      }

      toast.success(mode === "create" ? "Tạo khách hàng thành công" : "Cập nhật thành công");
      router.push("/customers");
      router.refresh();
    } catch (error) {
      console.error("Submit error:", error);
      toast.error(error instanceof Error ? error.message : "Có lỗi xảy ra");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Thông tin cơ bản</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fullName">Họ và tên *</Label>
            <Input
              id="fullName"
              {...register("fullName")}
              placeholder="Nguyễn Văn A"
            />
            {errors.fullName && (
              <p className="text-sm text-destructive">{errors.fullName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Số điện thoại *</Label>
            <Input
              id="phone"
              {...register("phone")}
              placeholder="0901234567"
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              placeholder="email@example.com"
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Địa chỉ</Label>
            <Input
              id="address"
              {...register("address")}
              placeholder="123 Đường ABC, Quận XYZ"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Giới tính</Label>
            <Select
              value={watch("gender")}
              onValueChange={(value) => setValue("gender", value as "MALE" | "FEMALE" | "OTHER")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn giới tính" />
              </SelectTrigger>
              <SelectContent>
                {genderOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="occupation">Nghề nghiệp</Label>
            <Input
              id="occupation"
              {...register("occupation")}
              placeholder="Kinh doanh, Nhân viên văn phòng..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="income">Mức thu nhập</Label>
            <Input
              id="income"
              {...register("income")}
              placeholder="10-20 triệu/tháng"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Phân loại</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Nguồn khách *</Label>
            <Select
              value={watch("source")}
              onValueChange={(value) => setValue("source", value as CustomerCreateInput["source"])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn nguồn" />
              </SelectTrigger>
              <SelectContent>
                {sourceOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Trạng thái *</Label>
            <Select
              value={watch("status")}
              onValueChange={(value) => setValue("status", value as CustomerCreateInput["status"])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Độ ưu tiên *</Label>
            <Select
              value={watch("priority")}
              onValueChange={(value) => setValue("priority", value as CustomerCreateInput["priority"])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn ưu tiên" />
              </SelectTrigger>
              <SelectContent>
                {priorityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === "create" ? "Tạo khách hàng" : "Lưu thay đổi"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Hủy
        </Button>
      </div>
    </form>
  );
}
