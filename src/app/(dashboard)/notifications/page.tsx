import { Suspense } from "react";
import { NotificationsPageContent } from "@/components/notifications/notifications-page-content";
import { Skeleton } from "@/components/ui/skeleton";

export default function NotificationsPage() {
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
      <NotificationsPageContent />
    </Suspense>
  );
}
