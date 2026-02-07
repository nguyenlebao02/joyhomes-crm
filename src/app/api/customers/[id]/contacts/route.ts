import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { customerContactSchema } from "@/lib/validators/customer-validation-schema";

// GET /api/customers/[id]/contacts - Get customer contacts
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
    const contacts = await db.customerContact.findMany({
      where: { customerId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(contacts);
  } catch (error) {
    console.error("GET /api/customers/[id]/contacts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/customers/[id]/contacts - Add contact
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
    const validated = customerContactSchema.safeParse({ ...body, customerId: id });

    if (!validated.success) {
      return NextResponse.json({ error: validated.error.issues }, { status: 400 });
    }

    // Update customer status if NEW
    const customer = await db.customer.findUnique({ where: { id } });
    if (customer?.status === "NEW") {
      await db.customer.update({
        where: { id },
        data: { status: "CONTACTED" },
      });
    }

    const contact = await db.customerContact.create({
      data: {
        customerId: id,
        type: validated.data.type as "CALL" | "SMS" | "EMAIL" | "ZALO" | "FACEBOOK" | "MEETING" | "SITE_VISIT",
        content: validated.data.content,
        result: validated.data.result,
        nextAction: validated.data.nextAction,
        createdBy: session.user.id,
      },
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    console.error("POST /api/customers/[id]/contacts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
