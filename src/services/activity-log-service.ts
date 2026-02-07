import { db } from "@/lib/db";

// Activity action types
type ActivityAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "VIEW"
  | "LOGIN"
  | "LOGOUT"
  | "APPROVE"
  | "CANCEL"
  | "ASSIGN";

// Entity types
type EntityType =
  | "CUSTOMER"
  | "BOOKING"
  | "PROJECT"
  | "PROPERTY"
  | "TASK"
  | "EVENT"
  | "USER";

// Log activity
export async function logActivity(
  userId: string,
  action: ActivityAction,
  entityType: EntityType,
  entityId: string
) {
  return db.activityLog.create({
    data: { userId, action, entityType, entityId },
  });
}

// Get activity logs with filters
export async function getActivityLogs(params: {
  userId?: string;
  entityType?: string;
  entityId?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}) {
  const { userId, entityType, entityId, action, startDate, endDate, page = 1, limit = 50 } = params;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (userId) where.userId = userId;
  if (entityType) where.entityType = entityType;
  if (entityId) where.entityId = entityId;
  if (action) where.action = action;
  if (startDate && endDate) {
    where.createdAt = { gte: startDate, lte: endDate };
  }

  const [logs, total] = await Promise.all([
    db.activityLog.findMany({
      where,
      include: {
        user: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.activityLog.count({ where }),
  ]);

  return {
    logs,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// Get recent activity for an entity
export async function getEntityActivity(entityType: string, entityId: string, limit = 10) {
  return db.activityLog.findMany({
    where: { entityType, entityId },
    include: {
      user: { select: { id: true, fullName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

// Get user's recent activity
export async function getUserActivity(userId: string, limit = 20) {
  return db.activityLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
