import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getEvents, createEvent, getUpcomingEvents } from "@/services/event-service";
import { eventCreateSchema } from "@/lib/validators/task-event-validation-schema";

// GET /api/events
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const upcoming = searchParams.get("upcoming") === "true";
    const type = searchParams.get("type") || undefined;
    const projectId = searchParams.get("projectId") || undefined;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (upcoming) {
      const events = await getUpcomingEvents(10);
      return NextResponse.json(events);
    }

    const events = await getEvents({
      type,
      projectId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("GET /api/events error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/events
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role as string;
    if (role !== "ADMIN" && role !== "MANAGER" && role !== "MARKETING") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validated = eventCreateSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ error: validated.error.issues }, { status: 400 });
    }

    const event = await createEvent(validated.data, session.user.id);
    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("POST /api/events error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
