import { Suspense } from "react";
import { InventoryProjectsContent } from "@/components/inventory/inventory-projects-content";
import { Skeleton } from "@/components/ui/skeleton";

export default function InventoryProjectsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      }
    >
      <InventoryProjectsContent />
    </Suspense>
  );
}
