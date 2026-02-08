"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Building2, MapPin, Search, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjects, useDeleteProject } from "@/hooks/use-inventory-queries";
import { DeleteConfirmationDialog } from "@/components/inventory/delete-confirmation-dialog";

const statusColors: Record<string, string> = {
  UPCOMING: "bg-blue-100 text-blue-800",
  OPEN: "bg-green-100 text-green-800",
  SOLD_OUT: "bg-red-100 text-red-800",
  COMPLETED: "bg-gray-100 text-gray-800",
};

const statusLabels: Record<string, string> = {
  UPCOMING: "Sắp mở bán",
  OPEN: "Đang mở bán",
  SOLD_OUT: "Hết hàng",
  COMPLETED: "Hoàn thành",
};

interface Project {
  id: string;
  code: string;
  name: string;
  location: string;
  status: string;
  totalUnits: number;
  availableUnits: number;
  _count?: { properties: number; bookings: number };
}

export function InventoryProjectsContent() {
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);

  const { data: projects, isLoading } = useProjects(search) as {
    data: Project[] | undefined;
    isLoading: boolean;
  };
  const deleteMutation = useDeleteProject();

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  return (
    <div className="space-y-6">
      {/* Search + Add */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm dự án..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Link href="/inventory/projects/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Thêm dự án
          </Button>
        </Link>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : projects?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Chưa có dự án nào</p>
            <Link href="/inventory/projects/new">
              <Button className="mt-4">Thêm dự án đầu tiên</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects?.map((project) => (
            <Card key={project.id} className="group relative h-full transition-shadow hover:shadow-md">
              {/* Action buttons */}
              <div className="absolute right-2 top-2 z-10 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Link href={`/inventory/projects/${project.id}/edit`} onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                </Link>
                <Button
                  variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={(e) => { e.preventDefault(); setDeleteTarget(project); }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              <Link href={`/inventory/projects/${project.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{project.code}</p>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusColors[project.status]}`}>
                      {statusLabels[project.status]}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {project.location}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Tổng căn</p>
                      <p className="text-lg font-semibold">{project.totalUnits}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Còn lại</p>
                      <p className="text-lg font-semibold text-green-600">{project.availableUnits}</p>
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      <DeleteConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Xoá dự án"
        description={`Bạn có chắc muốn xoá dự án "${deleteTarget?.name}"? Thao tác này không thể hoàn tác.`}
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
