"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { InventoryProjectsContent } from "@/components/inventory/inventory-projects-content";
import { InventoryPropertiesTab } from "@/components/inventory/inventory-properties-tab";

function InventoryPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams.get("tab") || "properties";

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.replace(`/inventory?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bảng hàng</h1>
        <p className="text-muted-foreground">Quản lý dự án và sản phẩm bất động sản</p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="properties">Bảng hàng</TabsTrigger>
          <TabsTrigger value="projects">Dự án</TabsTrigger>
        </TabsList>

        <TabsContent value="properties" className="mt-6">
          <InventoryPropertiesTab />
        </TabsContent>

        <TabsContent value="projects" className="mt-6">
          <InventoryProjectsContent />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function InventoryPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-96" />
        </div>
      }
    >
      <InventoryPageContent />
    </Suspense>
  );
}
