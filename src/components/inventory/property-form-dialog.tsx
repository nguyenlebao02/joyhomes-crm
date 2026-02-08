"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { propertyCreateSchema } from "@/lib/validators/inventory-validation-schema";
import { useCreateProperty, useUpdateProperty, useProjects, useDeleteProperty } from "@/hooks/use-inventory-queries";
import { DeleteConfirmationDialog } from "@/components/inventory/delete-confirmation-dialog";
import { useState } from "react";
import { z } from "zod";

const formSchema = propertyCreateSchema;
type FormValues = z.infer<typeof formSchema>;

interface PropertyData {
  id: string;
  code: string;
  building?: string;
  floor?: number;
  unit?: string;
  propertyType: string;
  area: number | string;
  bedrooms?: number;
  bathrooms?: number;
  direction?: string;
  view?: string;
  price: number | string;
  status: string;
  project?: { id: string; name: string; code: string };
}

interface PropertyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: PropertyData | null;
}

const propertyTypes = [
  { value: "APARTMENT", label: "Căn hộ" },
  { value: "VILLA", label: "Biệt thự" },
  { value: "TOWNHOUSE", label: "Nhà phố" },
  { value: "SHOPHOUSE", label: "Shophouse" },
  { value: "LAND", label: "Đất nền" },
  { value: "OFFICE", label: "Văn phòng" },
];

const statusOptions = [
  { value: "AVAILABLE", label: "Còn" },
  { value: "HOLD", label: "Giữ" },
  { value: "BOOKED", label: "Đặt cọc" },
  { value: "SOLD", label: "Đã bán" },
  { value: "UNAVAILABLE", label: "Không bán" },
];

const directions = ["Đông", "Tây", "Nam", "Bắc", "Đông Nam", "Đông Bắc", "Tây Nam", "Tây Bắc"];

export function PropertyFormDialog({ open, onOpenChange, property }: PropertyFormDialogProps) {
  const isEdit = !!property;
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: projects } = useProjects() as {
    data: { id: string; name: string; code: string }[] | undefined;
  };
  const createMutation = useCreateProperty();
  const updateMutation = useUpdateProperty(property?.id || "");
  const deleteMutation = useDeleteProperty();

  const form = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      code: "",
      projectId: "",
      building: "",
      floor: undefined,
      unit: "",
      propertyType: "APARTMENT",
      area: 0,
      bedrooms: undefined,
      bathrooms: undefined,
      direction: "",
      view: "",
      price: 0,
      status: "AVAILABLE",
    },
  });

  useEffect(() => {
    if (open && property) {
      form.reset({
        code: property.code,
        projectId: property.project?.id || "",
        building: property.building || "",
        floor: property.floor ?? undefined,
        unit: property.unit || "",
        propertyType: property.propertyType as FormValues["propertyType"],
        area: Number(property.area),
        bedrooms: property.bedrooms ?? undefined,
        bathrooms: property.bathrooms ?? undefined,
        direction: property.direction || "",
        view: property.view || "",
        price: Number(property.price),
        status: property.status as FormValues["status"],
      });
    } else if (open) {
      form.reset();
    }
  }, [open, property, form]);

  const onSubmit = (data: FormValues) => {
    if (isEdit) {
      const { projectId, ...updateData } = data;
      void projectId;
      updateMutation.mutate(updateData, {
        onSuccess: () => onOpenChange(false),
      });
    } else {
      createMutation.mutate(data, {
        onSuccess: () => onOpenChange(false),
      });
    }
  };

  const handleDelete = () => {
    if (!property) return;
    deleteMutation.mutate(property.id, {
      onSuccess: () => {
        setDeleteOpen(false);
        onOpenChange(false);
      },
    });
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{isEdit ? "Chỉnh sửa BĐS" : "Thêm BĐS mới"}</SheetTitle>
          </SheetHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
            {/* Project select */}
            <div className="space-y-2">
              <Label>Dự án *</Label>
              <Select
                value={form.watch("projectId")}
                onValueChange={(v) => form.setValue("projectId", v)}
                disabled={isEdit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn dự án" />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name} ({p.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.projectId && (
                <p className="text-sm text-destructive">{form.formState.errors.projectId.message}</p>
              )}
            </div>

            {/* Code */}
            <div className="space-y-2">
              <Label>Mã căn *</Label>
              <Input {...form.register("code")} placeholder="VD: A-12-01" />
              {form.formState.errors.code && (
                <p className="text-sm text-destructive">{form.formState.errors.code.message}</p>
              )}
            </div>

            {/* Building + Floor + Unit */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Tòa</Label>
                <Input {...form.register("building")} placeholder="A" />
              </div>
              <div className="space-y-2">
                <Label>Tầng</Label>
                <Input type="number" {...form.register("floor", { valueAsNumber: true })} placeholder="12" />
              </div>
              <div className="space-y-2">
                <Label>Căn</Label>
                <Input {...form.register("unit")} placeholder="01" />
              </div>
            </div>

            {/* Type + Status */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Loại BĐS *</Label>
                <Select
                  value={form.watch("propertyType")}
                  onValueChange={(v) => form.setValue("propertyType", v as FormValues["propertyType"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {propertyTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

            {/* Area + Price */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Diện tích (m²) *</Label>
                <Input type="number" step="0.01" {...form.register("area", { valueAsNumber: true })} />
                {form.formState.errors.area && (
                  <p className="text-sm text-destructive">{form.formState.errors.area.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Giá (VNĐ) *</Label>
                <Input type="number" {...form.register("price", { valueAsNumber: true })} />
                {form.formState.errors.price && (
                  <p className="text-sm text-destructive">{form.formState.errors.price.message}</p>
                )}
              </div>
            </div>

            {/* Bedrooms + Bathrooms */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Phòng ngủ</Label>
                <Input type="number" {...form.register("bedrooms", { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label>Phòng tắm</Label>
                <Input type="number" {...form.register("bathrooms", { valueAsNumber: true })} />
              </div>
            </div>

            {/* Direction + View */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Hướng</Label>
                <Select
                  value={form.watch("direction") || ""}
                  onValueChange={(v) => form.setValue("direction", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn hướng" />
                  </SelectTrigger>
                  <SelectContent>
                    {directions.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>View</Label>
                <Input {...form.register("view")} placeholder="Hồ bơi, công viên..." />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4">
              {isEdit ? (
                <Button type="button" variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
                  Xoá
                </Button>
              ) : (
                <div />
              )}
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Huỷ
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Đang lưu..." : isEdit ? "Cập nhật" : "Thêm mới"}
                </Button>
              </div>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      <DeleteConfirmationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Xoá bất động sản"
        description={`Bạn có chắc muốn xoá căn "${property?.code}"?`}
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}
