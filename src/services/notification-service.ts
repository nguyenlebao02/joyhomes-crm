import { db } from "@/lib/db";
import type { NotificationType } from "@/generated/prisma";

// Get user notifications
export async function getNotifications(userId: string, unreadOnly = false) {
  const where: Record<string, unknown> = { userId };
  if (unreadOnly) where.isRead = false;

  return db.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

// Get unread count
export async function getUnreadNotificationCount(userId: string) {
  return db.notification.count({
    where: { userId, isRead: false },
  });
}

// Create notification
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  content: string,
  entityType?: string,
  entityId?: string
) {
  return db.notification.create({
    data: { userId, type, title, content, entityType, entityId },
  });
}

// Create notifications for multiple users
export async function createBulkNotifications(
  userIds: string[],
  type: NotificationType,
  title: string,
  content: string,
  entityType?: string,
  entityId?: string
) {
  return db.notification.createMany({
    data: userIds.map((userId) => ({ userId, type, title, content, entityType, entityId })),
  });
}

// Mark notification as read
export async function markAsRead(id: string, userId: string) {
  return db.notification.updateMany({
    where: { id, userId },
    data: { isRead: true, readAt: new Date() },
  });
}

// Mark all as read
export async function markAllAsRead(userId: string) {
  return db.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
}

// Delete old notifications (cleanup job)
export async function deleteOldNotifications(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  return db.notification.deleteMany({
    where: { createdAt: { lt: cutoffDate }, isRead: true },
  });
}
