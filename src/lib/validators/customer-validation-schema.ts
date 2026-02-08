import { z } from "zod";

// Customer validation schema
export const customerCreateSchema = z.object({
  fullName: z.string().min(2, "Tên ít nhất 2 ký tự"),
  phone: z.string().regex(/^0[0-9]{9}$/, "Số điện thoại không hợp lệ"),
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
  address: z.string().optional(),
  dateOfBirth: z.coerce.date().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  occupation: z.string().optional(),
  income: z.string().optional(),
  source: z.enum([
    "FACEBOOK", "GOOGLE", "ZALO", "REFERRAL",
    "WALK_IN", "EVENT", "HOTLINE", "WEBSITE", "OTHER"
  ]).default("OTHER"),
  status: z.enum([
    "NEW", "CONTACTED", "QUALIFIED",
    "NEGOTIATING", "WON", "LOST", "DORMANT"
  ]).default("NEW"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
});

export const customerUpdateSchema = customerCreateSchema.partial();

export type CustomerCreateInput = z.infer<typeof customerCreateSchema>;
export type CustomerUpdateInput = z.infer<typeof customerUpdateSchema>;

// Customer contact validation schema
export const customerContactSchema = z.object({
  customerId: z.string().uuid(),
  type: z.enum(["CALL", "SMS", "EMAIL", "ZALO", "FACEBOOK", "MEETING", "SITE_VISIT"]),
  content: z.string().min(1, "Nội dung không được trống"),
  result: z.string().optional(),
  nextAction: z.string().optional(),
});

export type CustomerContactInput = z.infer<typeof customerContactSchema>;

// Reminder validation schema
export const reminderSchema = z.object({
  customerId: z.string().uuid(),
  title: z.string().min(1, "Tiêu đề không được trống"),
  description: z.string().optional(),
  remindAt: z.coerce.date(),
});

export type ReminderInput = z.infer<typeof reminderSchema>;

// Customer interest validation schema
export const customerInterestSchema = z.object({
  customerId: z.string().uuid(),
  projectId: z.string().uuid(),
  propertyType: z.string().optional(),
  budget: z.string().optional(),
  notes: z.string().optional(),
});

export type CustomerInterestInput = z.infer<typeof customerInterestSchema>;

// Search params schema
export const customerSearchSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.string().optional(),
  source: z.string().optional(),
  priority: z.string().optional(),
  sortBy: z.enum(["createdAt", "updatedAt", "fullName", "phone", "email", "status", "source", "priority"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CustomerSearchParams = z.infer<typeof customerSearchSchema>;
