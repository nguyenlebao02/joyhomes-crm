import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCustomers, createCustomer, getCustomerStats } from "@/services/customer-service";
import { customerCreateSchema, customerSearchSchema } from "@/lib/validators/customer-validation-schema";

// GET /api/customers - List customers with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Check if requesting stats
    if (searchParams.get("stats") === "true") {
      const stats = await getCustomerStats(session.user.id, session.user.role as string);
      return NextResponse.json(stats);
    }

    // Parse search params - filter out null values so defaults work
    const rawParams: Record<string, string> = {};
    const paramKeys = ["page", "limit", "search", "status", "source", "priority", "sortBy", "sortOrder"];
    for (const key of paramKeys) {
      const value = searchParams.get(key);
      if (value !== null && value !== "") {
        rawParams[key] = value;
      }
    }
    const params = customerSearchSchema.safeParse(rawParams);

    if (!params.success) {
      return NextResponse.json({ error: params.error.issues }, { status: 400 });
    }

    const result = await getCustomers({
      ...params.data,
      userId: session.user.id,
      role: session.user.role as string,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/customers error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/customers - Create new customer
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = customerCreateSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ error: validated.error.issues }, { status: 400 });
    }

    const customer = await createCustomer(validated.data, session.user.id);
    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error("POST /api/customers error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
