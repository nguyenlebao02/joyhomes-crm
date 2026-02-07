import { z } from "zod";

// Task status enum (matches Prisma schema)
export const TaskStatus = z.enum([
  "TODO",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]);

// Task priority enum
export const TaskPriority = z.enum([
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
]);

// Create task schema
export const taskCreateSchema = z.object({
  title: z.string().min(1, "Tiêu đề không được trống"),
  description: z.string().optional(),
  priority: TaskPriority.default("MEDIUM"),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
  customerId: z.string().optional(),
  bookingId: z.string().optional(),
});

// Update task schema
export const taskUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  priority: TaskPriority.optional(),
  status: TaskStatus.optional(),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
});

// Event type enum (matches Prisma schema)
export const EventType = z.enum([
  "KICKOFF",
  "GROUNDBREAKING",
  "OPENING",
  "TALK_SHOW",
  "TRAINING",
  "MEETING",
  "OTHER",
]);

// Event status enum
export const EventStatus = z.enum([
  "UPCOMING",
  "ONGOING",
  "COMPLETED",
  "CANCELLED",
]);

// Create event schema
export const eventCreateSchema = z.object({
  title: z.string().min(1, "Tiêu đề không được trống"),
  description: z.string().optional(),
  type: EventType.default("MEETING"),
  startDate: z.string().min(1, "Thời gian bắt đầu không được trống"),
  endDate: z.string().optional(),
  location: z.string().optional(),
  projectId: z.string().optional(),
});

// Update event schema
export const eventUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  type: EventType.optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  location: z.string().optional(),
  projectId: z.string().optional(),
  status: EventStatus.optional(),
});

// Types
export type TaskCreateInput = z.infer<typeof taskCreateSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;
export type EventCreateInput = z.infer<typeof eventCreateSchema>;
export type EventUpdateInput = z.infer<typeof eventUpdateSchema>;
