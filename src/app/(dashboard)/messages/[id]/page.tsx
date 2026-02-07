import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ChatThreadContent } from "@/components/chat/chat-thread-content";

export default async function ChatThreadPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/login");
  }

  return <ChatThreadContent currentUserId={session.user.id} />;
}
