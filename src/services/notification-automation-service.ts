import db from "@/lib/db";
import { addDays, differenceInDays, format, isSameDay, startOfDay } from "date-fns";
import { vi } from "date-fns/locale";

// Auto notification types
export type AutoNotificationType =
  | "NO_CONTACT_REMINDER"
  | "BIRTHDAY_REMINDER"
  | "BOOKING_FOLLOWUP"
  | "REMINDER_DUE"
  | "HIGH_PRIORITY_LEAD";

export interface AutoNotification {
  type: AutoNotificationType;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  title: string;
  content: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  entityType?: string;
  entityId?: string;
  actionSuggestion?: string;
  dueDate?: Date;
}

// Automation settings
export interface AutomationSettings {
  noContactDays: number; // Days without contact before reminder
  birthdayReminderDays: number; // Days before birthday to remind
  bookingFollowupDays: number; // Days after booking to follow up
  enabled: boolean;
}

const DEFAULT_SETTINGS: AutomationSettings = {
  noContactDays: 7,
  birthdayReminderDays: 3,
  bookingFollowupDays: 3,
  enabled: true,
};

/**
 * Generate all auto notifications for a user
 */
export async function generateAutoNotifications(
  userId: string,
  role: string,
  settings: AutomationSettings = DEFAULT_SETTINGS
): Promise<AutoNotification[]> {
  if (!settings.enabled) return [];

  const notifications: AutoNotification[] = [];

  // Get user's customers
  const where: { deletedAt: null; userId?: string } = { deletedAt: null };
  if (role === "SALES") {
    where.userId = userId;
  }

  const [
    noContactNotifications,
    birthdayNotifications,
    bookingFollowups,
    dueReminders,
    highPriorityLeads,
  ] = await Promise.all([
    generateNoContactReminders(where, settings.noContactDays),
    generateBirthdayReminders(where, settings.birthdayReminderDays),
    generateBookingFollowups(where, settings.bookingFollowupDays),
    generateDueReminders(where),
    generateHighPriorityLeadAlerts(where),
  ]);

  notifications.push(...noContactNotifications);
  notifications.push(...birthdayNotifications);
  notifications.push(...bookingFollowups);
  notifications.push(...dueReminders);
  notifications.push(...highPriorityLeads);

  // Sort by priority
  const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  return notifications.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

/**
 * Generate no-contact reminders
 */
async function generateNoContactReminders(
  where: { deletedAt: null; userId?: string },
  daysThreshold: number
): Promise<AutoNotification[]> {
  const customers = await db.customer.findMany({
    where: {
      ...where,
      status: { notIn: ["WON", "LOST"] },
    },
    include: {
      contacts: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const notifications: AutoNotification[] = [];
  const now = new Date();

  for (const customer of customers) {
    const lastContact = customer.contacts[0];
    const lastDate = lastContact ? new Date(lastContact.createdAt) : new Date(customer.createdAt);
    const daysSince = differenceInDays(now, lastDate);

    if (daysSince >= daysThreshold) {
      let priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT" = "MEDIUM";
      if (daysSince > 21) priority = "URGENT";
      else if (daysSince > 14) priority = "HIGH";

      notifications.push({
        type: "NO_CONTACT_REMINDER",
        priority,
        title: `Nhắc nhở liên hệ khách hàng`,
        content: `${customer.fullName} chưa được liên hệ trong ${daysSince} ngày`,
        customerId: customer.id,
        customerName: customer.fullName,
        customerPhone: customer.phone,
        actionSuggestion: "Gọi điện hoặc gửi tin nhắn để duy trì quan hệ",
      });
    }
  }

  return notifications;
}

/**
 * Generate birthday reminders
 */
async function generateBirthdayReminders(
  where: { deletedAt: null; userId?: string },
  daysBefore: number
): Promise<AutoNotification[]> {
  const customers = await db.customer.findMany({
    where: {
      ...where,
      dateOfBirth: { not: null },
      status: { notIn: ["LOST"] },
    },
    select: {
      id: true,
      fullName: true,
      phone: true,
      dateOfBirth: true,
    },
  });

  const notifications: AutoNotification[] = [];
  const today = startOfDay(new Date());

  for (const customer of customers) {
    if (!customer.dateOfBirth) continue;

    const dob = new Date(customer.dateOfBirth);
    const thisYearBirthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());

    // If birthday already passed this year, check next year
    if (thisYearBirthday < today) {
      thisYearBirthday.setFullYear(thisYearBirthday.getFullYear() + 1);
    }

    const daysUntil = differenceInDays(thisYearBirthday, today);

    if (daysUntil <= daysBefore && daysUntil >= 0) {
      let priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT" = "MEDIUM";
      if (daysUntil === 0) priority = "HIGH";

      const birthdayStr = format(thisYearBirthday, "dd/MM", { locale: vi });

      notifications.push({
        type: "BIRTHDAY_REMINDER",
        priority,
        title: daysUntil === 0 ? "Sinh nhật hôm nay!" : "Sinh nhật sắp tới",
        content: daysUntil === 0
          ? `Hôm nay là sinh nhật của ${customer.fullName}`
          : `${customer.fullName} sẽ sinh nhật vào ${birthdayStr} (còn ${daysUntil} ngày)`,
        customerId: customer.id,
        customerName: customer.fullName,
        customerPhone: customer.phone,
        actionSuggestion: "Gửi lời chúc sinh nhật để tạo ấn tượng tốt",
        dueDate: thisYearBirthday,
      });
    }
  }

  return notifications;
}

/**
 * Generate booking follow-up reminders
 */
async function generateBookingFollowups(
  where: { deletedAt: null; userId?: string },
  daysAfter: number
): Promise<AutoNotification[]> {
  const followupDate = addDays(new Date(), -daysAfter);

  const bookings = await db.booking.findMany({
    where: {
      customer: where,
      status: { in: ["PENDING", "APPROVED", "DEPOSITED"] },
      createdAt: { lte: followupDate },
    },
    include: {
      customer: { select: { id: true, fullName: true, phone: true } },
      property: { select: { code: true } },
      project: { select: { name: true } },
    },
  });

  const notifications: AutoNotification[] = [];

  for (const booking of bookings) {
    const daysSince = differenceInDays(new Date(), new Date(booking.createdAt));

    notifications.push({
      type: "BOOKING_FOLLOWUP",
      priority: booking.status === "PENDING" ? "HIGH" : "MEDIUM",
      title: "Follow-up booking",
      content: `Booking ${booking.code} (${booking.project.name} - ${booking.property.code}) của ${booking.customer.fullName} đã ${daysSince} ngày - cần follow-up`,
      customerId: booking.customerId,
      customerName: booking.customer.fullName,
      customerPhone: booking.customer.phone,
      entityType: "booking",
      entityId: booking.id,
      actionSuggestion: getBookingFollowupSuggestion(booking.status),
    });
  }

  return notifications;
}

/**
 * Generate due reminder notifications
 */
async function generateDueReminders(
  where: { deletedAt: null; userId?: string }
): Promise<AutoNotification[]> {
  const tomorrow = addDays(startOfDay(new Date()), 1);

  const reminders = await db.reminder.findMany({
    where: {
      customer: where,
      isCompleted: false,
      remindAt: { lte: tomorrow },
    },
    include: {
      customer: { select: { id: true, fullName: true, phone: true } },
    },
    orderBy: { remindAt: "asc" },
  });

  const notifications: AutoNotification[] = [];
  const today = startOfDay(new Date());

  for (const reminder of reminders) {
    const remindDate = startOfDay(new Date(reminder.remindAt));
    const isOverdue = remindDate < today;
    const isToday = isSameDay(remindDate, today);

    let priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT" = "MEDIUM";
    if (isOverdue) priority = "URGENT";
    else if (isToday) priority = "HIGH";

    notifications.push({
      type: "REMINDER_DUE",
      priority,
      title: isOverdue ? "Nhắc lịch quá hạn" : isToday ? "Nhắc lịch hôm nay" : "Nhắc lịch sắp tới",
      content: `${reminder.title} - ${reminder.customer.fullName}`,
      customerId: reminder.customerId,
      customerName: reminder.customer.fullName,
      customerPhone: reminder.customer.phone,
      entityType: "reminder",
      entityId: reminder.id,
      dueDate: reminder.remindAt,
    });
  }

  return notifications;
}

/**
 * Generate high priority lead alerts
 */
async function generateHighPriorityLeadAlerts(
  where: { deletedAt: null; userId?: string }
): Promise<AutoNotification[]> {
  const customers = await db.customer.findMany({
    where: {
      ...where,
      priority: { in: ["HIGH", "URGENT"] },
      status: { in: ["NEW", "CONTACTED"] },
    },
    include: {
      contacts: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const notifications: AutoNotification[] = [];

  for (const customer of customers) {
    const lastContact = customer.contacts[0];
    const daysSinceContact = lastContact
      ? differenceInDays(new Date(), new Date(lastContact.createdAt))
      : differenceInDays(new Date(), new Date(customer.createdAt));

    if (daysSinceContact > 2) {
      notifications.push({
        type: "HIGH_PRIORITY_LEAD",
        priority: customer.priority === "URGENT" ? "URGENT" : "HIGH",
        title: `Lead ${customer.priority === "URGENT" ? "khẩn cấp" : "ưu tiên cao"}`,
        content: `${customer.fullName} - ${customer.priority === "URGENT" ? "CẦN XỬ LÝ NGAY" : "Cần ưu tiên liên hệ"} (${daysSinceContact} ngày chưa liên hệ)`,
        customerId: customer.id,
        customerName: customer.fullName,
        customerPhone: customer.phone,
        actionSuggestion: "Liên hệ ngay để không bỏ lỡ cơ hội",
      });
    }
  }

  return notifications;
}

/**
 * Save auto notifications to database
 */
export async function saveAutoNotifications(
  userId: string,
  notifications: AutoNotification[]
): Promise<number> {
  // Avoid duplicate notifications by checking existing
  const today = startOfDay(new Date());

  const existing = await db.notification.findMany({
    where: {
      userId,
      createdAt: { gte: today },
    },
    select: { entityId: true, entityType: true },
  });

  const existingKeys = new Set(
    existing.map((e) => `${e.entityType}-${e.entityId}`)
  );

  const newNotifications = notifications.filter((n) => {
    const key = `${n.entityType || n.type}-${n.entityId || n.customerId}`;
    return !existingKeys.has(key);
  });

  if (newNotifications.length === 0) return 0;

  await db.notification.createMany({
    data: newNotifications.map((n) => ({
      userId,
      title: n.title,
      content: n.content,
      type: "SYSTEM" as const,
      entityType: n.entityType || n.type,
      entityId: n.entityId || n.customerId,
    })),
  });

  return newNotifications.length;
}

/**
 * Get automation settings for a user
 */
export async function getAutomationSettings(userId: string): Promise<AutomationSettings> {
  const setting = await db.setting.findUnique({
    where: { key: `automation_${userId}` },
  });

  if (!setting) return DEFAULT_SETTINGS;

  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(setting.value) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save automation settings for a user
 */
export async function saveAutomationSettings(
  userId: string,
  settings: Partial<AutomationSettings>
): Promise<AutomationSettings> {
  const current = await getAutomationSettings(userId);
  const updated = { ...current, ...settings };

  await db.setting.upsert({
    where: { key: `automation_${userId}` },
    create: {
      key: `automation_${userId}`,
      value: JSON.stringify(updated),
      type: "json",
    },
    update: {
      value: JSON.stringify(updated),
    },
  });

  return updated;
}

// Helper function
function getBookingFollowupSuggestion(status: string): string {
  switch (status) {
    case "PENDING":
      return "Xác nhận booking và thu đặt cọc";
    case "APPROVED":
      return "Thúc đẩy khách đặt cọc";
    case "DEPOSITED":
      return "Chuẩn bị hợp đồng và hẹn ký";
    default:
      return "Liên hệ cập nhật tình hình";
  }
}
