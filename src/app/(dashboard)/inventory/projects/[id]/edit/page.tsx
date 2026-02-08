"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectForm } from "@/components/inventory/project-form";
import { useProject, useUpdateProject } from "@/hooks/use-inventory-queries";

export default function EditProjectPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: project, isLoading } = useProject(id) as {
    data: Record<string, unknown> | undefined;
    isLoading: boolean;
  };
  const updateMutation = useUpdateProject(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Không tìm thấy dự án</p>
        <Link href="/inventory?tab=projects">
          <Button variant="link">Quay lại</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/inventory/projects/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Chỉnh sửa dự án</h1>
      </div>

      <ProjectForm
        title="Thông tin dự án"
        isPending={updateMutation.isPending}
        defaultValues={{
          code: project.code as string,
          name: project.name as string,
          developer: project.developer as string,
          location: project.location as string,
          address: (project.address as string) || "",
          district: (project.district as string) || "",
          city: (project.city as string) || "",
          description: (project.description as string) || "",
          totalUnits: project.totalUnits as number,
          status: project.status as "UPCOMING" | "OPEN" | "SOLD_OUT" | "COMPLETED",
          commissionRate: project.commissionRate ? Number(project.commissionRate) : undefined,
        }}
        onSubmit={(data) => {
          updateMutation.mutate(data, {
            onSuccess: () => router.push(`/inventory/projects/${id}`),
          });
        }}
      />
    </div>
  );
}
