import { db } from "@/lib/db";
import type { TaskCreateInput, TaskUpdateInput } from "@/lib/validators/task-event-validation-schema";

// Get tasks with filters
export async function getTasks(params: {
  status?: string;
  assigneeId?: string;
  creatorId?: string;
  priority?: string;
}) {
  const { status, assigneeId, creatorId, priority } = params;
  const where: Record<string, unknown> = {};

  if (status) where.status = status;
  if (assigneeId) where.assigneeId = assigneeId;
  if (creatorId) where.creatorId = creatorId;
  if (priority) where.priority = priority;

  return db.task.findMany({
    where,
    include: {
      assignee: { select: { id: true, fullName: true } },
      creator: { select: { id: true, fullName: true } },
    },
    orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
  });
}

// Get task by ID
export async function getTaskById(id: string) {
  return db.task.findUnique({
    where: { id },
    include: {
      assignee: { select: { id: true, fullName: true, email: true } },
      creator: { select: { id: true, fullName: true } },
    },
  });
}

// Create task
export async function createTask(data: TaskCreateInput, creatorId: string) {
  return db.task.create({
    data: {
      title: data.title,
      description: data.description,
      priority: data.priority,
      status: "TODO",
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      assigneeId: data.assigneeId,
      creatorId,
      customerId: data.customerId,
      bookingId: data.bookingId,
    },
    include: {
      assignee: { select: { id: true, fullName: true } },
      creator: { select: { id: true, fullName: true } },
    },
  });
}

// Update task
export async function updateTask(id: string, data: TaskUpdateInput) {
  return db.task.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      priority: data.priority,
      status: data.status,
      assigneeId: data.assigneeId,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    },
    include: {
      assignee: { select: { id: true, fullName: true } },
      creator: { select: { id: true, fullName: true } },
    },
  });
}

// Delete task
export async function deleteTask(id: string) {
  return db.task.delete({ where: { id } });
}

// Get my tasks (assigned to me or created by me)
export async function getMyTasks(userId: string) {
  return db.task.findMany({
    where: {
      OR: [{ assigneeId: userId }, { creatorId: userId }],
      status: { not: "CANCELLED" },
    },
    include: {
      assignee: { select: { id: true, fullName: true } },
      creator: { select: { id: true, fullName: true } },
    },
    orderBy: [{ status: "asc" }, { priority: "desc" }, { dueDate: "asc" }],
  });
}

// Get overdue tasks
export async function getOverdueTasks(userId?: string) {
  const where: Record<string, unknown> = {
    dueDate: { lt: new Date() },
    status: { in: ["TODO", "IN_PROGRESS"] },
  };

  if (userId) {
    where.OR = [{ assigneeId: userId }, { creatorId: userId }];
  }

  return db.task.findMany({
    where,
    include: {
      assignee: { select: { id: true, fullName: true } },
    },
    orderBy: { dueDate: "asc" },
  });
}
