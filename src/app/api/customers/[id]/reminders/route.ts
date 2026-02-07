import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { reminderSchema } from "@/lib/validators/customer-validation-schema";

// GET /api/customers/[id]/reminders - Get customer reminders
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
    const reminders = await db.reminder.findMany({
      where: { customerId: id },
      orderBy: { remindAt: "asc" },
    });

    return NextResponse.json(reminders);
  } catch (error) {
    console.error("GET /api/customers/[id]/reminders error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/customers/[id]/reminders - Add reminder
export async function POST(
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
    const validated = reminderSchema.safeParse({ ...body, customerId: id });

    if (!validated.success) {
      return NextResponse.json({ error: validated.error.issues }, { status: 400 });
    }

    const reminder = await db.reminder.create({
      data: {
        customerId: id,
        title: validated.data.title,
        description: validated.data.description,
        remindAt: validated.data.remindAt,
      },
    });

    return NextResponse.json(reminder, { status: 201 });
  } catch (error) {
    console.error("POST /api/customers/[id]/reminders error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/customers/[id]/reminders - Complete reminder
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { reminderId } = body;

    if (!reminderId) {
      return NextResponse.json({ error: "Reminder ID required" }, { status: 400 });
    }

    const reminder = await db.reminder.update({
      where: { id: reminderId },
      data: {
        isCompleted: true,
        completedAt: new Date(),
      },
    });

    return NextResponse.json(reminder);
  } catch (error) {
    console.error("PATCH /api/customers/[id]/reminders error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
