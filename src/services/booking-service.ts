import { db } from "@/lib/db";
import type { BookingStatus, TransactionType, PaymentMethod } from "@/generated/prisma";
import type { BookingCreateInput, BookingUpdateInput } from "@/lib/validators/booking-validation-schema";

// Generate booking code: BK-YYYYMMDD-XXXX
function generateBookingCode(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BK-${dateStr}-${random}`;
}

// Generate transaction code: TXN-YYYYMMDD-XXXX
function generateTransactionCode(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TXN-${dateStr}-${random}`;
}

// Valid status transitions
const STATUS_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ["APPROVED", "CANCELLED"],
  APPROVED: ["DEPOSITED", "CANCELLED"],
  DEPOSITED: ["CONTRACTED", "CANCELLED", "REFUNDED"],
  CONTRACTED: ["COMPLETED", "CANCELLED", "REFUNDED"],
  COMPLETED: [],
  CANCELLED: [],
  REFUNDED: [],
};

// Validate status transition
export function isValidStatusTransition(from: BookingStatus, to: BookingStatus): boolean {
  return STATUS_TRANSITIONS[from]?.includes(to) || false;
}

// Get next valid statuses
export function getNextValidStatuses(currentStatus: BookingStatus): BookingStatus[] {
  return STATUS_TRANSITIONS[currentStatus] || [];
}

// Get all bookings with filters
export async function getBookings(params: {
  search?: string;
  status?: string;
  projectId?: string;
  userId?: string;
  page?: number;
  limit?: number;
}) {
  const { search, status, projectId, userId, page = 1, limit = 20 } = params;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { code: { contains: search, mode: "insensitive" } },
      { customer: { fullName: { contains: search, mode: "insensitive" } } },
      { property: { code: { contains: search, mode: "insensitive" } } },
    ];
  }

  if (status) {
    where.status = status;
  }

  if (projectId) {
    where.projectId = projectId;
  }

  if (userId) {
    where.userId = userId;
  }

  const [bookings, total] = await Promise.all([
    db.booking.findMany({
      where,
      include: {
        customer: { select: { id: true, fullName: true, phone: true } },
        property: {
          select: {
            id: true,
            code: true,
            building: true,
            floor: true,
            area: true,
            project: { select: { id: true, name: true, code: true } },
          },
        },
        user: { select: { id: true, fullName: true } },
        transactions: { select: { id: true, type: true, amount: true, createdAt: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.booking.count({ where }),
  ]);

  return {
    bookings,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// Get booking by ID
export async function getBookingById(id: string) {
  return db.booking.findUnique({
    where: { id },
    include: {
      customer: true,
      property: {
        include: {
          project: true,
        },
      },
      user: { select: { id: true, fullName: true, email: true } },
      transactions: {
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

// Create new booking
export async function createBooking(data: BookingCreateInput, userId: string) {
  // Get property to check availability and get project commission rate
  const property = await db.property.findUnique({
    where: { id: data.propertyId },
    include: { project: true },
  });

  if (!property) {
    throw new Error("Sản phẩm không tồn tại");
  }

  if (property.status !== "AVAILABLE" && property.status !== "HOLD") {
    throw new Error("Sản phẩm không khả dụng để đặt");
  }

  // Calculate commission
  const commissionRate = Number(property.project.commissionRate) || 2;
  const commissionAmount = (data.agreedPrice * commissionRate) / 100;

  // Create booking and update property status
  const [booking] = await db.$transaction([
    db.booking.create({
      data: {
        code: generateBookingCode(),
        propertyId: data.propertyId,
        projectId: property.projectId,
        customerId: data.customerId,
        userId,
        agreedPrice: data.agreedPrice,
        depositAmount: data.depositAmount || 0,
        depositDate: data.depositDate ? new Date(data.depositDate) : null,
        commissionRate,
        commissionAmount,
        status: "PENDING",
        notes: data.notes,
      },
      include: {
        customer: true,
        property: { include: { project: true } },
        user: { select: { id: true, fullName: true } },
      },
    }),
    db.property.update({
      where: { id: data.propertyId },
      data: { status: "HOLD" },
    }),
  ]);

  return booking;
}

// Update booking
export async function updateBooking(id: string, data: BookingUpdateInput) {
  // Recalculate commission if sale price changed
  let commissionAmount: number | undefined;
  if (data.agreedPrice) {
    const booking = await db.booking.findUnique({ where: { id } });
    if (booking) {
      commissionAmount = (data.agreedPrice * (Number(booking.commissionRate) || 2)) / 100;
    }
  }

  return db.booking.update({
    where: { id },
    data: {
      agreedPrice: data.agreedPrice,
      depositAmount: data.depositAmount,
      depositDate: data.depositDate ? new Date(data.depositDate) : undefined,
      contractDate: data.contractDate ? new Date(data.contractDate) : undefined,
      status: data.status,
      notes: data.notes,
      commissionAmount,
    },
    include: {
      customer: true,
      property: { include: { project: true } },
      user: { select: { id: true, fullName: true } },
    },
  });
}

// Approve booking
export async function approveBooking(id: string) {
  const booking = await db.booking.findUnique({ where: { id } });
  if (!booking) throw new Error("Booking không tồn tại");
  if (booking.status !== "PENDING") throw new Error("Chỉ có thể duyệt booking đang chờ");

  return db.$transaction([
    db.booking.update({
      where: { id },
      data: { status: "APPROVED" },
    }),
    db.property.update({
      where: { id: booking.propertyId },
      data: { status: "BOOKED" },
    }),
  ]);
}

// Cancel booking
export async function cancelBooking(id: string, reason: string) {
  const booking = await db.booking.findUnique({ where: { id } });
  if (!booking) throw new Error("Booking không tồn tại");
  if (booking.status === "COMPLETED") throw new Error("Không thể hủy booking đã hoàn thành");

  return db.$transaction([
    db.booking.update({
      where: { id },
      data: { status: "CANCELLED", notes: `${booking.notes || ""}\n[HỦY] ${reason}` },
    }),
    db.property.update({
      where: { id: booking.propertyId },
      data: { status: "AVAILABLE" },
    }),
  ]);
}

// Add transaction (deposit/payment/refund)
export async function addTransaction(
  bookingId: string,
  type: "DEPOSIT" | "PAYMENT" | "COMMISSION" | "REFUND",
  amount: number,
  paymentMethod?: "CASH" | "BANK_TRANSFER" | "CARD" | "OTHER",
  notes?: string,
  createdBy?: string
) {
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { transactions: true }
  });
  if (!booking) throw new Error("Booking không tồn tại");

  const transaction = await db.transaction.create({
    data: {
      code: generateTransactionCode(),
      bookingId,
      type,
      amount,
      paymentMethod,
      paymentDate: new Date(),
      notes,
      status: "CONFIRMED",
      createdBy: createdBy || "system",
    },
  });

  // Update booking based on transaction type
  if (type === "DEPOSIT" && booking.status === "APPROVED") {
    await db.booking.update({
      where: { id: bookingId },
      data: {
        status: "DEPOSITED",
        depositAmount: { increment: amount },
        depositDate: new Date(),
      },
    });
  }

  return transaction;
}

// Update booking status with validation
export async function updateBookingStatus(
  id: string,
  newStatus: BookingStatus,
  contractNumber?: string,
  notes?: string
) {
  const booking = await db.booking.findUnique({ where: { id } });
  if (!booking) throw new Error("Booking không tồn tại");

  if (!isValidStatusTransition(booking.status, newStatus)) {
    throw new Error(`Không thể chuyển từ "${booking.status}" sang "${newStatus}"`);
  }

  const updateData: Record<string, unknown> = { status: newStatus };

  if (newStatus === "CONTRACTED") {
    updateData.contractNumber = contractNumber;
    updateData.contractDate = new Date();
  }

  if (notes) {
    updateData.notes = `${booking.notes || ""}\n[${newStatus}] ${notes}`.trim();
  }

  // Update property status based on booking status
  const propertyStatus = newStatus === "COMPLETED" ? "SOLD"
    : newStatus === "CANCELLED" || newStatus === "REFUNDED" ? "AVAILABLE"
    : undefined;

  if (propertyStatus) {
    return db.$transaction([
      db.booking.update({ where: { id }, data: updateData }),
      db.property.update({ where: { id: booking.propertyId }, data: { status: propertyStatus } }),
    ]);
  }

  return db.booking.update({
    where: { id },
    data: updateData,
    include: {
      customer: true,
      property: { include: { project: true } },
      user: { select: { id: true, fullName: true } },
      transactions: { orderBy: { createdAt: "desc" } },
    },
  });
}

// Get transactions for a booking
export async function getBookingTransactions(bookingId: string) {
  return db.transaction.findMany({
    where: { bookingId },
    orderBy: { createdAt: "desc" },
  });
}

// Calculate payment summary for a booking
export async function getBookingPaymentSummary(bookingId: string) {
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { transactions: { where: { status: "CONFIRMED" } } },
  });

  if (!booking) throw new Error("Booking không tồn tại");

  const deposits = booking.transactions
    .filter(t => t.type === "DEPOSIT")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const payments = booking.transactions
    .filter(t => t.type === "PAYMENT")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const refunds = booking.transactions
    .filter(t => t.type === "REFUND")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalPaid = deposits + payments - refunds;
  const remaining = Number(booking.agreedPrice) - totalPaid;

  return {
    agreedPrice: Number(booking.agreedPrice),
    deposits,
    payments,
    refunds,
    totalPaid,
    remaining,
    commissionAmount: Number(booking.commissionAmount),
    commissionRate: Number(booking.commissionRate),
  };
}

// Delete/cancel a transaction
export async function cancelTransaction(transactionId: string, reason: string) {
  const transaction = await db.transaction.findUnique({
    where: { id: transactionId },
    include: { booking: true },
  });

  if (!transaction) throw new Error("Giao dịch không tồn tại");
  if (transaction.status === "CANCELLED") throw new Error("Giao dịch đã bị hủy");

  // Revert deposit amount if it was a deposit
  if (transaction.type === "DEPOSIT") {
    await db.booking.update({
      where: { id: transaction.bookingId },
      data: { depositAmount: { decrement: Number(transaction.amount) } },
    });
  }

  return db.transaction.update({
    where: { id: transactionId },
    data: {
      status: "CANCELLED",
      notes: `${transaction.notes || ""}\n[HỦY] ${reason}`.trim(),
    },
  });
}

// Get booking statistics
export async function getBookingStats(projectId?: string) {
  const where = projectId ? { projectId } : {};

  const [total, pending, approved, deposited, contracted, completed, cancelled] =
    await Promise.all([
      db.booking.count({ where }),
      db.booking.count({ where: { ...where, status: "PENDING" } }),
      db.booking.count({ where: { ...where, status: "APPROVED" } }),
      db.booking.count({ where: { ...where, status: "DEPOSITED" } }),
      db.booking.count({ where: { ...where, status: "CONTRACTED" } }),
      db.booking.count({ where: { ...where, status: "COMPLETED" } }),
      db.booking.count({ where: { ...where, status: "CANCELLED" } }),
    ]);

  // Total revenue from completed bookings
  const revenue = await db.booking.aggregate({
    where: { ...where, status: "COMPLETED" },
    _sum: { agreedPrice: true },
  });

  // Total commission
  const commission = await db.booking.aggregate({
    where: { ...where, status: "COMPLETED" },
    _sum: { commissionAmount: true },
  });

  return {
    total,
    pending,
    approved,
    deposited,
    contracted,
    completed,
    cancelled,
    revenue: revenue._sum.agreedPrice || 0,
    commission: commission._sum.commissionAmount || 0,
  };
}
