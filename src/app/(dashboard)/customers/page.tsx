import { Suspense } from "react";
import { CustomersPageContent } from "@/components/customers/customers-page-content";
import { Skeleton } from "@/components/ui/skeleton";

export default function CustomersPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      }
    >
      <CustomersPageContent />
    </Suspense>
  );
}
