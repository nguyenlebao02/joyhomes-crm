import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getConversationById, getMessages } from "@/services/chat-service";

// GET /api/chat/conversations/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const messages = searchParams.get("messages") === "true";
    const cursor = searchParams.get("cursor") || undefined;

    if (messages) {
      const messageList = await getMessages(id, session.user.id, cursor);
      return NextResponse.json(messageList);
    }

    const conversation = await getConversationById(id, session.user.id);

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    return NextResponse.json(conversation);
  } catch (error) {
    console.error("GET /api/chat/conversations/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
