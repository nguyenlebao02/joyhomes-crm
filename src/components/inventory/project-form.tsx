"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { projectCreateSchema } from "@/lib/validators/inventory-validation-schema";
import { z } from "zod";

const formSchema = projectCreateSchema;
type FormValues = z.infer<typeof formSchema>;

const statusOptions = [
  { value: "UPCOMING", label: "Sắp mở bán" },
  { value: "OPEN", label: "Đang mở bán" },
  { value: "SOLD_OUT", label: "Hết hàng" },
  { value: "COMPLETED", label: "Hoàn thành" },
];

interface ProjectFormProps {
  defaultValues?: Partial<FormValues>;
  onSubmit: (data: FormValues) => void;
  isPending: boolean;
  title: string;
}

export function ProjectForm({ defaultValues, onSubmit, isPending, title }: ProjectFormProps) {
  const router = useRouter();

  const form = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      code: "",
      name: "",
      developer: "",
      location: "",
      address: "",
      district: "",
      city: "",
      description: "",
      totalUnits: 0,
      status: "UPCOMING",
      commissionRate: undefined,
      ...defaultValues,
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Code + Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mã dự án *</Label>
              <Input {...form.register("code")} placeholder="VD: VH-GP" />
              {form.formState.errors.code && (
                <p className="text-sm text-destructive">{form.formState.errors.code.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Tên dự án *</Label>
              <Input {...form.register("name")} placeholder="VD: Vinhomes Grand Park" />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
          </div>

          {/* Developer + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Chủ đầu tư *</Label>
              <Input {...form.register("developer")} placeholder="VD: Vingroup" />
              {form.formState.errors.developer && (
                <p className="text-sm text-destructive">{form.formState.errors.developer.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Trạng thái</Label>
              <Select
                value={form.watch("status")}
                onValueChange={(v) => form.setValue("status", v as FormValues["status"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label>Vị trí *</Label>
            <Input {...form.register("location")} placeholder="VD: Quận 9, TP.HCM" />
            {form.formState.errors.location && (
              <p className="text-sm text-destructive">{form.formState.errors.location.message}</p>
            )}
          </div>

          {/* Address + District + City */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Địa chỉ</Label>
              <Input {...form.register("address")} />
            </div>
            <div className="space-y-2">
              <Label>Quận/Huyện</Label>
              <Input {...form.register("district")} />
            </div>
            <div className="space-y-2">
              <Label>Thành phố</Label>
              <Input {...form.register("city")} />
            </div>
          </div>

          {/* Total units + Commission */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tổng số căn</Label>
              <Input type="number" {...form.register("totalUnits", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>Hoa hồng (%)</Label>
              <Input type="number" step="0.01" {...form.register("commissionRate", { valueAsNumber: true })} />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Mô tả</Label>
            <Textarea {...form.register("description")} rows={3} />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Huỷ
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Đang lưu..." : "Lưu"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
