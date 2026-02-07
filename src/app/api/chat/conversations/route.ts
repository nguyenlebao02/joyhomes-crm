import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getConversations, createConversation, getUnreadCount } from "@/services/chat-service";
import { conversationCreateSchema } from "@/lib/validators/chat-validation-schema";

// GET /api/chat/conversations
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const unreadOnly = searchParams.get("unread") === "true";

    if (unreadOnly) {
      const count = await getUnreadCount(session.user.id);
      return NextResponse.json({ unreadCount: count });
    }

    const conversations = await getConversations(session.user.id);
    return NextResponse.json(conversations);
  } catch (error) {
    console.error("GET /api/chat/conversations error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/chat/conversations
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = conversationCreateSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ error: validated.error.issues }, { status: 400 });
    }

    const conversation = await createConversation(validated.data, session.user.id);
    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    console.error("POST /api/chat/conversations error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
