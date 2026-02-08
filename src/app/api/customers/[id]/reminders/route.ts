import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { reminderSchema } from "@/lib/validators/customer-validation-schema";
import { verifyCustomerAccess } from "@/services/customer-service";

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

    // Verify user has access to this customer
    const customer = await verifyCustomerAccess(id, session.user.id, session.user.role as string);
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

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

    // Verify user has access to this customer
    const customer = await verifyCustomerAccess(id, session.user.id, session.user.role as string);
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

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

    const { id } = await params;

    // Verify user has access to this customer
    const customer = await verifyCustomerAccess(id, session.user.id, session.user.role as string);
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const body = await request.json();
    const { reminderId } = body;

    if (!reminderId) {
      return NextResponse.json({ error: "Reminder ID required" }, { status: 400 });
    }

    // Verify reminder belongs to this customer (prevents IDOR)
    const existing = await db.reminder.findFirst({
      where: { id: reminderId, customerId: id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Reminder not found" }, { status: 404 });
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
