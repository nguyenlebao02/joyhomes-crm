import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sendMessage } from "@/services/chat-service";
import { messageCreateSchema } from "@/lib/validators/chat-validation-schema";

// POST /api/chat/messages
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = messageCreateSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ error: validated.error.issues }, { status: 400 });
    }

    const message = await sendMessage(validated.data, session.user.id);
    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("POST /api/chat/messages error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
