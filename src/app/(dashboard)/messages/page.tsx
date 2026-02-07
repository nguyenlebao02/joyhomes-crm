import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ChatPageContent } from "@/components/chat/chat-page-content";
import { Skeleton } from "@/components/ui/skeleton";

export default async function MessagesPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-64" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </div>
      }
    >
      <ChatPageContent currentUserId={session.user.id} />
    </Suspense>
  );
}
