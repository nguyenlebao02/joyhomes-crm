import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getBookingById,
  updateBooking,
  approveBooking,
  cancelBooking,
  addTransaction,
  updateBookingStatus,
  getBookingPaymentSummary,
  getNextValidStatuses,
} from "@/services/booking-service";
import { bookingUpdateSchema } from "@/lib/validators/booking-validation-schema";
import { UserRole, BookingStatus } from "@/generated/prisma";

// GET /api/bookings/[id]
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
    const booking = await getBookingById(id);

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Sales can only view their own bookings
    const role = session.user.role as UserRole;
    if (role === "SALES" && booking.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error("GET /api/bookings/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/bookings/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role as UserRole;
    const { id } = await params;
    const body = await request.json();

    // Handle special actions - check if ADMIN or MANAGER
    const canManageBookings = role === "ADMIN" || role === "MANAGER";

    if (body.action === "approve") {
      if (!canManageBookings) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const result = await approveBooking(id);
      return NextResponse.json(result[0]);
    }

    if (body.action === "cancel") {
      if (!canManageBookings) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (!body.reason) {
        return NextResponse.json({ error: "Reason is required" }, { status: 400 });
      }
      const result = await cancelBooking(id, body.reason);
      return NextResponse.json(result[0]);
    }

    if (body.action === "add_deposit" || body.action === "add_payment" || body.action === "add_refund") {
      if (!canManageBookings && role !== "ACCOUNTANT") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const typeMap: Record<string, "DEPOSIT" | "PAYMENT" | "REFUND"> = {
        add_deposit: "DEPOSIT",
        add_payment: "PAYMENT",
        add_refund: "REFUND",
      };
      const transaction = await addTransaction(
        id,
        typeMap[body.action],
        body.amount,
        body.paymentMethod,
        body.notes,
        session.user.id
      );
      return NextResponse.json(transaction);
    }

    // Handle status transition
    if (body.action === "update_status") {
      if (!canManageBookings) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const result = await updateBookingStatus(
        id,
        body.status as BookingStatus,
        body.contractNumber,
        body.notes
      );
      return NextResponse.json(Array.isArray(result) ? result[0] : result);
    }

    // Get payment summary
    if (body.action === "payment_summary") {
      const summary = await getBookingPaymentSummary(id);
      return NextResponse.json(summary);
    }

    // Get next valid statuses
    if (body.action === "next_statuses") {
      const booking = await getBookingById(id);
      if (!booking) {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      }
      const nextStatuses = getNextValidStatuses(booking.status);
      return NextResponse.json({ currentStatus: booking.status, nextStatuses });
    }

    // Regular update
    if (!canManageBookings) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const validated = bookingUpdateSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ error: validated.error.issues }, { status: 400 });
    }

    const booking = await updateBooking(id, validated.data);
    return NextResponse.json(booking);
  } catch (error) {
    console.error("PATCH /api/bookings/[id] error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
