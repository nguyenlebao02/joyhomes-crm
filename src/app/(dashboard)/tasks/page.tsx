import { Suspense } from "react";
import { TasksPageContent } from "@/components/tasks/tasks-page-content";
import { Skeleton } from "@/components/ui/skeleton";

export default function TasksPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </div>
      }
    >
      <TasksPageContent />
    </Suspense>
  );
}
