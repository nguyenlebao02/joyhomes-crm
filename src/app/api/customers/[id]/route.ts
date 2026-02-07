import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCustomerById, updateCustomer, deleteCustomer, addCustomerContact, addReminder } from "@/services/customer-service";
import { customerUpdateSchema, customerContactSchema, reminderSchema } from "@/lib/validators/customer-validation-schema";

// GET /api/customers/[id] - Get customer details
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
    const customer = await getCustomerById(id, session.user.id, session.user.role as string);

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error("GET /api/customers/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/customers/[id] - Update customer
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
    const validated = customerUpdateSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ error: validated.error.issues }, { status: 400 });
    }

    const customer = await updateCustomer(id, validated.data, session.user.id, session.user.role as string);
    return NextResponse.json(customer);
  } catch (error) {
    console.error("PATCH /api/customers/[id] error:", error);
    if (error instanceof Error && error.message.includes("quyền")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/customers/[id] - Soft delete customer
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await deleteCustomer(id, session.user.id, session.user.role as string);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/customers/[id] error:", error);
    if (error instanceof Error && error.message.includes("quyền")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/customers/[id] - Add contact or reminder
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
    const action = body.action;

    if (action === "contact") {
      const validated = customerContactSchema.safeParse({ ...body, customerId: id });
      if (!validated.success) {
        return NextResponse.json({ error: validated.error.issues }, { status: 400 });
      }
      const contact = await addCustomerContact(id, validated.data, session.user.id);
      return NextResponse.json(contact, { status: 201 });
    }

    if (action === "reminder") {
      const validated = reminderSchema.safeParse({ ...body, customerId: id });
      if (!validated.success) {
        return NextResponse.json({ error: validated.error.issues }, { status: 400 });
      }
      const reminder = await addReminder(id, validated.data);
      return NextResponse.json(reminder, { status: 201 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("POST /api/customers/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
