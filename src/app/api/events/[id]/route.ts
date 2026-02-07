import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getEventById,
  updateEvent,
  deleteEvent,
  registerForEvent,
  checkInToEvent,
} from "@/services/event-service";
import { eventUpdateSchema } from "@/lib/validators/task-event-validation-schema";

// GET /api/events/[id]
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
    const event = await getEventById(id);

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error("GET /api/events/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/events/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Handle special actions
    if (body.action === "register") {
      try {
        const attendee = await registerForEvent(id, session.user.id);
        return NextResponse.json(attendee);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to register";
        return NextResponse.json({ error: message }, { status: 400 });
      }
    }

    if (body.action === "checkin") {
      const attendee = await checkInToEvent(id, session.user.id);
      return NextResponse.json(attendee);
    }

    // Regular update - requires permission
    const role = session.user.role as string;
    if (role !== "ADMIN" && role !== "MANAGER" && role !== "MARKETING") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const validated = eventUpdateSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ error: validated.error.issues }, { status: 400 });
    }

    const event = await updateEvent(id, validated.data);
    return NextResponse.json(event);
  } catch (error) {
    console.error("PATCH /api/events/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/events/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role as string;
    if (role !== "ADMIN" && role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    await deleteEvent(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/events/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
