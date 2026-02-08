"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectForm } from "@/components/inventory/project-form";
import { useCreateProject } from "@/hooks/use-inventory-queries";

export default function NewProjectPage() {
  const router = useRouter();
  const createMutation = useCreateProject();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/inventory?tab=projects">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Thêm dự án mới</h1>
      </div>

      <ProjectForm
        title="Thông tin dự án"
        isPending={createMutation.isPending}
        onSubmit={(data) => {
          createMutation.mutate(data, {
            onSuccess: () => router.push("/inventory?tab=projects"),
          });
        }}
      />
    </div>
  );
}
