import { Suspense } from "react";
import { SettingsPageContent } from "@/components/settings/settings-page-content";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      }
    >
      <SettingsPageContent />
    </Suspense>
  );
}
