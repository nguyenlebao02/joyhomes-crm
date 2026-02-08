"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, MapPin, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PropertyGridComponent } from "@/components/inventory/property-grid-component";

async function fetchProject(id: string) {
  const res = await fetch(`/api/inventory/projects/${id}`);
  if (!res.ok) throw new Error("Failed to fetch project");
  return res.json();
}

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

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: () => fetchProject(id),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Không tìm thấy dự án</p>
        <Link href="/inventory">
          <Button variant="link">Quay lại</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/inventory">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusColors[project.status]}`}>
                {statusLabels[project.status]}
              </span>
            </div>
            <p className="text-muted-foreground">{project.code}</p>
          </div>
        </div>
        <Link href={`/inventory/projects/${id}/edit`}>
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Chỉnh sửa
          </Button>
        </Link>
      </div>

      {/* Project Info */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vị trí</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{project.location}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Chủ đầu tư</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span>{project.developer}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng căn</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{project.totalUnits}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Còn lại</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{project.availableUnits}</p>
          </CardContent>
        </Card>
      </div>

      {/* Properties Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Bảng hàng chi tiết</CardTitle>
        </CardHeader>
        <CardContent>
          <PropertyGridComponent projectId={id} properties={project.properties || []} />
        </CardContent>
      </Card>
    </div>
  );
}
