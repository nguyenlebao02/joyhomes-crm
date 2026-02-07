import { Suspense } from "react";
import { ReportsPageContent } from "@/components/reports/reports-page-content";
import { Skeleton } from "@/components/ui/skeleton";

export default function ReportsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-[300px]" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-[250px]" />
            <Skeleton className="h-[250px]" />
          </div>
        </div>
      }
    >
      <ReportsPageContent />
    </Suspense>
  );
}
