import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getActivityLogs } from "@/services/activity-log-service";
import { hasPermission } from "@/lib/auth-permissions";
import { UserRole } from "@/generated/prisma";

// GET /api/activity-logs
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role as UserRole;
    // Only ADMIN and MANAGER can view all activity logs
    if (!hasPermission(role, "reports:read")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId") || undefined;
    const entityType = searchParams.get("entityType") || undefined;
    const entityId = searchParams.get("entityId") || undefined;
    const action = searchParams.get("action") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const result = await getActivityLogs({
      userId,
      entityType,
      entityId,
      action,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/activity-logs error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
