import db from "@/lib/db";
import { CustomerCreateInput, CustomerUpdateInput, CustomerSearchParams } from "@/lib/validators/customer-validation-schema";
import { Prisma } from "@/generated/prisma";

/**
 * Generate unique customer code
 */
async function generateCustomerCode(): Promise<string> {
  const count = await db.customer.count();
  return `KH-${String(count + 1).padStart(6, "0")}`;
}

/**
 * Get customers with pagination, search, and filters
 */
export async function getCustomers(params: CustomerSearchParams & { userId: string; role: string }) {
  const { userId, role, page, limit, search, status, source, priority, sortBy, sortOrder } = params;

  const where: Prisma.CustomerWhereInput = { deletedAt: null };

  // Sales only see their own customers
  if (role === "SALES") {
    where.userId = userId;
  }

  // Search filter
  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { phone: { contains: search } },
      { email: { contains: search, mode: "insensitive" } },
      { code: { contains: search, mode: "insensitive" } },
    ];
  }

  // Status filter
  if (status) {
    where.status = status as Prisma.EnumCustomerStatusFilter;
  }

  // Source filter
  if (source) {
    where.source = source as Prisma.EnumLeadSourceFilter;
  }

  // Priority filter
  if (priority) {
    where.priority = priority as Prisma.EnumPriorityFilter;
  }

  const skip = (page - 1) * limit;

  const [customers, total] = await Promise.all([
    db.customer.findMany({
      where,
      take: limit,
      skip,
      orderBy: { [sortBy]: sortOrder },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        _count: { select: { bookings: true, reminders: true, contacts: true } },
      },
    }),
    db.customer.count({ where }),
  ]);

  return {
    customers,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Verify user has access to a customer (ownership check for SALES role).
 * Returns the customer if accessible, null otherwise.
 */
export async function verifyCustomerAccess(customerId: string, userId: string, role: string) {
  const where: Prisma.CustomerWhereInput = { id: customerId, deletedAt: null };
  if (role === "SALES") {
    where.userId = userId;
  }
  return db.customer.findFirst({ where, select: { id: true } });
}

/**
 * Get single customer by ID
 */
export async function getCustomerById(id: string, userId: string, role: string) {
  const where: Prisma.CustomerWhereInput = { id, deletedAt: null };

  // Sales only see their own customers
  if (role === "SALES") {
    where.userId = userId;
  }

  return db.customer.findFirst({
    where,
    include: {
      user: { select: { id: true, fullName: true, email: true, phone: true } },
      contacts: { orderBy: { createdAt: "desc" }, take: 10 },
      reminders: { orderBy: { remindAt: "asc" }, where: { isCompleted: false } },
      interests: { include: { project: { select: { id: true, name: true, code: true } } } },
      bookings: { include: { property: true }, take: 5 },
      notes: { orderBy: { createdAt: "desc" }, take: 5 },
      _count: { select: { bookings: true, reminders: true, contacts: true } },
    },
  });
}

/**
 * Create new customer
 */
export async function createCustomer(data: CustomerCreateInput, userId: string) {
  const code = await generateCustomerCode();

  return db.customer.create({
    data: {
      ...data,
      code,
      userId,
    },
  });
}

/**
 * Update customer
 */
export async function updateCustomer(id: string, data: CustomerUpdateInput, userId: string, role: string) {
  // Check ownership for SALES role
  if (role === "SALES") {
    const customer = await db.customer.findFirst({ where: { id, userId } });
    if (!customer) {
      throw new Error("Không có quyền cập nhật khách hàng này");
    }
  }

  return db.customer.update({
    where: { id },
    data: {
      ...data,
      updatedAt: new Date(),
    },
  });
}

/**
 * Soft delete customer
 */
export async function deleteCustomer(id: string, userId: string, role: string) {
  // Only ADMIN and MANAGER can delete
  if (role !== "ADMIN" && role !== "MANAGER") {
    throw new Error("Không có quyền xóa khách hàng");
  }

  return db.customer.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

/**
 * Add contact history
 */
export async function addCustomerContact(
  customerId: string,
  data: { type: string; content: string; result?: string; nextAction?: string },
  createdBy: string
) {
  // Update customer status if NEW
  const customer = await db.customer.findUnique({ where: { id: customerId } });
  if (customer?.status === "NEW") {
    await db.customer.update({
      where: { id: customerId },
      data: { status: "CONTACTED" },
    });
  }

  return db.customerContact.create({
    data: {
      customerId,
      type: data.type as "CALL" | "SMS" | "EMAIL" | "ZALO" | "FACEBOOK" | "MEETING" | "SITE_VISIT",
      content: data.content,
      result: data.result,
      nextAction: data.nextAction,
      createdBy,
    },
  });
}

/**
 * Add reminder
 */
export async function addReminder(
  customerId: string,
  data: { title: string; description?: string; remindAt: Date }
) {
  return db.reminder.create({
    data: {
      customerId,
      title: data.title,
      description: data.description,
      remindAt: data.remindAt,
    },
  });
}

/**
 * Complete reminder
 */
export async function completeReminder(id: string) {
  return db.reminder.update({
    where: { id },
    data: {
      isCompleted: true,
      completedAt: new Date(),
    },
  });
}

/**
 * Get customer stats for dashboard
 */
export async function getCustomerStats(userId: string, role: string) {
  const where: Prisma.CustomerWhereInput = { deletedAt: null };

  if (role === "SALES") {
    where.userId = userId;
  }

  const [total, byStatus, bySource, recentReminders] = await Promise.all([
    db.customer.count({ where }),
    db.customer.groupBy({
      by: ["status"],
      where,
      _count: true,
    }),
    db.customer.groupBy({
      by: ["source"],
      where,
      _count: true,
    }),
    db.reminder.findMany({
      where: {
        customer: where,
        isCompleted: false,
        remindAt: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      },
      include: { customer: { select: { fullName: true, phone: true } } },
      orderBy: { remindAt: "asc" },
      take: 10,
    }),
  ]);

  return { total, byStatus, bySource, recentReminders };
}
