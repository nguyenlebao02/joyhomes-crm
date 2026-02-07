import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPropertyById, updateProperty, updatePropertyStatus } from "@/services/inventory-service";
import { propertyUpdateSchema } from "@/lib/validators/inventory-validation-schema";

// GET /api/inventory/properties/[id]
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
    const property = await getPropertyById(id);

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    return NextResponse.json(property);
  } catch (error) {
    console.error("GET /api/inventory/properties/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/inventory/properties/[id]
export async function PATCH(
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
    const body = await request.json();

    // Quick status update
    if (body.action === "update_status" && body.status) {
      const property = await updatePropertyStatus(id, body.status);
      return NextResponse.json(property);
    }

    const validated = propertyUpdateSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ error: validated.error.issues }, { status: 400 });
    }

    const property = await updateProperty(id, validated.data);
    return NextResponse.json(property);
  } catch (error) {
    console.error("PATCH /api/inventory/properties/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
