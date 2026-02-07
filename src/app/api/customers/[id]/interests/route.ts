import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { customerInterestSchema } from "@/lib/validators/customer-validation-schema";

// GET /api/customers/[id]/interests - Get customer interests
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
    const interests = await db.customerInterest.findMany({
      where: { customerId: id },
      include: {
        project: { select: { id: true, name: true, code: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(interests);
  } catch (error) {
    console.error("GET /api/customers/[id]/interests error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/customers/[id]/interests - Add interest
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
    const validated = customerInterestSchema.safeParse({ ...body, customerId: id });

    if (!validated.success) {
      return NextResponse.json({ error: validated.error.issues }, { status: 400 });
    }

    // Check if interest already exists
    const existing = await db.customerInterest.findFirst({
      where: { customerId: id, projectId: validated.data.projectId },
    });

    if (existing) {
      return NextResponse.json({ error: "Khách hàng đã quan tâm dự án này" }, { status: 400 });
    }

    const interest = await db.customerInterest.create({
      data: {
        customerId: id,
        projectId: validated.data.projectId,
        propertyType: validated.data.propertyType,
        budget: validated.data.budget,
        notes: validated.data.notes,
      },
      include: {
        project: { select: { id: true, name: true, code: true } },
      },
    });

    return NextResponse.json(interest, { status: 201 });
  } catch (error) {
    console.error("POST /api/customers/[id]/interests error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/customers/[id]/interests - Remove interest
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const interestId = searchParams.get("interestId");

    if (!interestId) {
      return NextResponse.json({ error: "Interest ID required" }, { status: 400 });
    }

    await db.customerInterest.delete({
      where: { id: interestId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/customers/[id]/interests error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
