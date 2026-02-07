import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllAsRead,
} from "@/services/notification-service";

// GET /api/notifications
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const countOnly = searchParams.get("count") === "true";
    const unreadOnly = searchParams.get("unread") === "true";

    if (countOnly) {
      const count = await getUnreadNotificationCount(session.user.id);
      return NextResponse.json({ count });
    }

    const notifications = await getNotifications(session.user.id, unreadOnly);
    return NextResponse.json(notifications);
  } catch (error) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/notifications - Mark all as read
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    if (body.action === "mark_all_read") {
      await markAllAsRead(session.user.id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("POST /api/notifications error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
