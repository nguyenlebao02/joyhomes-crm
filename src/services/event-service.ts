import { db } from "@/lib/db";
import type { EventCreateInput, EventUpdateInput } from "@/lib/validators/task-event-validation-schema";

// Get events with filters
export async function getEvents(params: {
  startDate?: Date;
  endDate?: Date;
  type?: string;
  projectId?: string;
}) {
  const { startDate, endDate, type, projectId } = params;
  const where: Record<string, unknown> = {};

  if (startDate && endDate) {
    where.startDate = { gte: startDate, lte: endDate };
  }
  if (type) where.type = type;
  if (projectId) where.projectId = projectId;

  return db.event.findMany({
    where,
    include: {
      project: { select: { id: true, name: true, code: true } },
      _count: { select: { attendees: true } },
    },
    orderBy: { startDate: "asc" },
  });
}

// Get event by ID
export async function getEventById(id: string) {
  return db.event.findUnique({
    where: { id },
    include: {
      project: true,
      attendees: {
        include: {
          user: { select: { id: true, fullName: true, email: true } },
        },
      },
    },
  });
}

// Create event
export async function createEvent(data: EventCreateInput, creatorId: string) {
  return db.event.create({
    data: {
      title: data.title,
      description: data.description,
      type: data.type,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      location: data.location,
      projectId: data.projectId,
      createdBy: creatorId,
    },
    include: {
      project: { select: { id: true, name: true } },
    },
  });
}

// Update event
export async function updateEvent(id: string, data: EventUpdateInput) {
  return db.event.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      type: data.type,
      location: data.location,
      projectId: data.projectId,
      status: data.status,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    },
  });
}

// Delete event
export async function deleteEvent(id: string) {
  return db.event.delete({ where: { id } });
}

// Register for event
export async function registerForEvent(eventId: string, userId: string) {
  // Check if already registered
  const existing = await db.eventAttendee.findFirst({
    where: { eventId, userId },
  });

  if (existing) {
    throw new Error("Bạn đã đăng ký sự kiện này");
  }

  return db.eventAttendee.create({
    data: { eventId, userId },
  });
}

// Check in to event
export async function checkInToEvent(eventId: string, userId: string) {
  const attendee = await db.eventAttendee.findFirst({
    where: { eventId, userId },
  });

  if (!attendee) {
    // Auto-register and check in
    return db.eventAttendee.create({
      data: { eventId, userId, checkedIn: true, checkedInAt: new Date() },
    });
  }

  return db.eventAttendee.update({
    where: { id: attendee.id },
    data: { checkedIn: true, checkedInAt: new Date() },
  });
}

// Get upcoming events
export async function getUpcomingEvents(limit = 5) {
  return db.event.findMany({
    where: { startDate: { gte: new Date() } },
    include: {
      project: { select: { id: true, name: true } },
      _count: { select: { attendees: true } },
    },
    orderBy: { startDate: "asc" },
    take: limit,
  });
}
