"use client";

import { useState } from "react";
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
import { bookingCreateSchema, type BookingCreateInput } from "@/lib/validators/booking-validation-schema";

async function fetchCustomers() {
  const res = await fetch("/api/customers?limit=100");
  if (!res.ok) throw new Error("Failed to fetch customers");
  return res.json();
}

async function fetchProjects() {
  const res = await fetch("/api/inventory/projects");
  if (!res.ok) throw new Error("Failed to fetch projects");
  return res.json();
}

async function fetchProperties(projectId: string) {
  const res = await fetch(`/api/inventory/projects/${projectId}`);
  if (!res.ok) throw new Error("Failed to fetch properties");
  return res.json();
}

export default function NewBookingPage() {
  const router = useRouter();
  const [selectedProject, setSelectedProject] = useState("");

  const { data: customersData } = useQuery({
    queryKey: ["customers-select"],
    queryFn: fetchCustomers,
  });

  const { data: projects } = useQuery({
    queryKey: ["projects-select"],
    queryFn: fetchProjects,
  });

  const { data: projectDetail } = useQuery({
    queryKey: ["project-properties", selectedProject],
    queryFn: () => fetchProperties(selectedProject),
    enabled: !!selectedProject,
  });

  const customers = customersData?.customers || [];
  const availableProperties = (projectDetail?.properties || []).filter(
    (p: { status: string }) => p.status === "AVAILABLE" || p.status === "HOLD"
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BookingCreateInput>({
    resolver: zodResolver(bookingCreateSchema) as never,
  });

  const createMutation = useMutation({
    mutationFn: async (data: BookingCreateInput) => {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create booking");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast.success("Tạo booking thành công");
      router.push(`/bookings/${data.id}`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const onSubmit = (data: BookingCreateInput) => {
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/bookings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Tạo booking mới</h1>
          <p className="text-muted-foreground">Đặt chỗ sản phẩm cho khách hàng</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Customer Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Chọn khách hàng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Khách hàng *</Label>
              <Select onValueChange={(value) => setValue("customerId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn khách hàng" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c: { id: string; fullName: string; phone: string }) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.fullName} - {c.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.customerId && (
                <p className="text-sm text-red-500">{errors.customerId.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Property Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Chọn sản phẩm</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Dự án *</Label>
              <Select onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn dự án" />
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

            {selectedProject && (
              <div className="space-y-2">
                <Label>Căn hộ/Sản phẩm *</Label>
                <Select onValueChange={(value) => setValue("propertyId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn sản phẩm" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProperties.map((p: { id: string; code: string; area: number; price: number }) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.code} - {p.area}m² - {(Number(p.price) / 1000000000).toFixed(1)} tỷ
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.propertyId && (
                  <p className="text-sm text-red-500">{errors.propertyId.message}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Price & Deposit */}
        <Card>
          <CardHeader>
            <CardTitle>Giá bán & Đặt cọc</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Giá bán (VNĐ) *</Label>
                <Input
                  type="number"
                  placeholder="Ví dụ: 5000000000"
                  {...register("agreedPrice", { valueAsNumber: true })}
                />
                {errors.agreedPrice && (
                  <p className="text-sm text-red-500">{errors.agreedPrice.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Tiền cọc (VNĐ)</Label>
                <Input
                  type="number"
                  placeholder="Ví dụ: 100000000"
                  {...register("depositAmount", { valueAsNumber: true })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Ghi chú</Label>
              <Textarea placeholder="Ghi chú thêm..." {...register("notes")} />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Link href="/bookings">
            <Button type="button" variant="outline">
              Hủy
            </Button>
          </Link>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Đang tạo..." : "Tạo booking"}
          </Button>
        </div>
      </form>
    </div>
  );
}
