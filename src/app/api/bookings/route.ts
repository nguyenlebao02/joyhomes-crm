import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getBookings, createBooking, getBookingStats } from "@/services/booking-service";
import { bookingCreateSchema } from "@/lib/validators/booking-validation-schema";
import { UserRole } from "@/generated/prisma";

// GET /api/bookings
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") || undefined;
    const projectId = searchParams.get("projectId") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const stats = searchParams.get("stats") === "true";

    // Return stats if requested
    if (stats) {
      const bookingStats = await getBookingStats(projectId);
      return NextResponse.json(bookingStats);
    }

    const role = session.user.role as string;
    // Sales only see their own bookings
    const userId = role === "SALES" ? session.user.id : undefined;

    const result = await getBookings({ search, status, projectId, userId, page, limit });
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/bookings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/bookings
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role as UserRole;
    // Only ADMIN, MANAGER, SALES can create bookings
    if (role !== "ADMIN" && role !== "MANAGER" && role !== "SALES") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validated = bookingCreateSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ error: validated.error.issues }, { status: 400 });
    }

    const booking = await createBooking(validated.data, session.user.id);
    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error("POST /api/bookings error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
