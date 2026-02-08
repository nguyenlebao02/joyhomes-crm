import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { bulkCreateProperties } from "@/services/inventory-service";
import { propertyCreateSchema } from "@/lib/validators/inventory-validation-schema";
import { z } from "zod";

const importSchema = z.object({
  properties: z.array(propertyCreateSchema).min(1, "Cần ít nhất 1 bản ghi"),
});

// POST /api/inventory/properties/import
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
    const validated = importSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ error: validated.error.issues }, { status: 400 });
    }

    const result = await bulkCreateProperties(validated.data.properties);

    return NextResponse.json({
      success: true,
      count: result.count,
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/inventory/properties/import error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
