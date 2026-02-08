import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getProperties, createProperty, getPropertyStats, bulkUpdatePropertyStatus } from "@/services/inventory-service";
import { propertyCreateSchema, propertySearchSchema } from "@/lib/validators/inventory-validation-schema";
import { z } from "zod";

const PropertyStatusEnum = z.enum(["AVAILABLE", "HOLD", "BOOKED", "SOLD", "UNAVAILABLE"]);
const bulkStatusUpdateSchema = z.object({
  action: z.literal("bulk_status_update"),
  ids: z.array(z.string().uuid()).min(1),
  status: PropertyStatusEnum,
});

// GET /api/inventory/properties - List properties
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    if (searchParams.get("stats") === "true") {
      const stats = await getPropertyStats(searchParams.get("projectId") || undefined);
      return NextResponse.json(stats);
    }

    const params = propertySearchSchema.safeParse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      projectId: searchParams.get("projectId"),
      status: searchParams.get("status"),
      propertyType: searchParams.get("propertyType"),
      building: searchParams.get("building"),
      direction: searchParams.get("direction"),
      minPrice: searchParams.get("minPrice"),
      maxPrice: searchParams.get("maxPrice"),
      minArea: searchParams.get("minArea"),
      maxArea: searchParams.get("maxArea"),
      bedrooms: searchParams.get("bedrooms"),
      search: searchParams.get("search"),
    });

    if (!params.success) {
      return NextResponse.json({ error: params.error.issues }, { status: 400 });
    }

    const result = await getProperties(params.data);
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/inventory/properties error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/inventory/properties - Create property or bulk update
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role as string;
    if (role !== "ADMIN" && role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // Bulk status update
    if (body.action === "bulk_status_update") {
      const validated = bulkStatusUpdateSchema.safeParse(body);
      if (!validated.success) {
        return NextResponse.json({ error: validated.error.issues }, { status: 400 });
      }
      const result = await bulkUpdatePropertyStatus(validated.data.ids, validated.data.status);
      return NextResponse.json(result);
    }

    // Create single property
    const validated = propertyCreateSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ error: validated.error.issues }, { status: 400 });
    }

    const property = await createProperty(validated.data);
    return NextResponse.json(property, { status: 201 });
  } catch (error) {
    console.error("POST /api/inventory/properties error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
