"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Plus, Trash2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const interestFormSchema = z.object({
  projectId: z.string().min(1, "Chọn dự án"),
  propertyType: z.string().optional(),
  budget: z.string().optional(),
  notes: z.string().optional(),
});

type InterestFormData = z.infer<typeof interestFormSchema>;

interface Project {
  id: string;
  name: string;
  code: string;
  status?: string;
}

interface Interest {
  id: string;
  projectId: string;
  project: Project;
  propertyType?: string;
  budget?: string;
  notes?: string;
}

interface CustomerInterestsSectionProps {
  customerId: string;
  interests: Interest[];
}

async function fetchProjects(): Promise<Project[]> {
  const res = await fetch("/api/projects?limit=100");
  if (!res.ok) return [];
  const data = await res.json();
  return data.projects || [];
}

export function CustomerInterestsSection({ customerId, interests }: CustomerInterestsSectionProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: projects = [] } = useQuery({
    queryKey: ["projects-list"],
    queryFn: fetchProjects,
  });

  const form = useForm<InterestFormData>({
    resolver: zodResolver(interestFormSchema),
    defaultValues: { projectId: "", propertyType: "", budget: "", notes: "" },
  });

  const addMutation = useMutation({
    mutationFn: async (data: InterestFormData) => {
      const res = await fetch(`/api/customers/${customerId}/interests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add interest");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer", customerId] });
      toast.success("Đã thêm dự án quan tâm");
      form.reset();
      setOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Không thể thêm");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (interestId: string) => {
      const res = await fetch(`/api/customers/${customerId}/interests?interestId=${interestId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete interest");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer", customerId] });
      toast.success("Đã xóa");
    },
    onError: () => {
      toast.error("Không thể xóa");
    },
  });

  const onSubmit = (data: InterestFormData) => {
    addMutation.mutate(data);
  };

  // Filter out already interested projects
  const availableProjects = projects.filter(
    (p) => !interests.some((i) => i.projectId === p.id)
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Quan tâm dự án
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
              <DialogTitle>Thêm dự án quan tâm</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Dự án</Label>
                <Select
                  value={form.watch("projectId")}
                  onValueChange={(v) => form.setValue("projectId", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn dự án" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProjects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name} ({project.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.projectId && (
                  <p className="text-sm text-destructive">{form.formState.errors.projectId.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Loại BĐS quan tâm</Label>
                <Select
                  value={form.watch("propertyType") || ""}
                  onValueChange={(v) => form.setValue("propertyType", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="APARTMENT">Căn hộ</SelectItem>
                    <SelectItem value="VILLA">Biệt thự</SelectItem>
                    <SelectItem value="TOWNHOUSE">Nhà phố</SelectItem>
                    <SelectItem value="SHOPHOUSE">Shophouse</SelectItem>
                    <SelectItem value="LAND">Đất nền</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ngân sách</Label>
                <Input {...form.register("budget")} placeholder="VD: 2-3 tỷ" />
              </div>
              <div className="space-y-2">
                <Label>Ghi chú</Label>
                <Input {...form.register("notes")} placeholder="Ghi chú thêm..." />
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
        {interests?.length > 0 ? (
          <div className="space-y-2">
            {interests.map((interest) => (
              <div
                key={interest.id}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
              >
                <div>
                  <p className="text-sm font-medium">
                    {interest.project.name} ({interest.project.code})
                  </p>
                  <div className="flex gap-2 text-xs text-muted-foreground mt-0.5">
                    {interest.propertyType && <span>{interest.propertyType}</span>}
                    {interest.budget && <span>| {interest.budget}</span>}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-destructive hover:text-destructive"
                  onClick={() => deleteMutation.mutate(interest.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Chưa có thông tin</p>
        )}
      </CardContent>
    </Card>
  );
}
