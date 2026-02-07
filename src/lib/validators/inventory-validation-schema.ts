import { z } from "zod";

// Project validation schema
export const projectCreateSchema = z.object({
  code: z.string().min(2, "Mã dự án ít nhất 2 ký tự"),
  name: z.string().min(2, "Tên dự án ít nhất 2 ký tự"),
  developer: z.string().min(2, "Tên chủ đầu tư ít nhất 2 ký tự"),
  location: z.string().min(2, "Vị trí ít nhất 2 ký tự"),
  address: z.string().optional(),
  district: z.string().optional(),
  city: z.string().optional(),
  description: z.string().optional(),
  totalUnits: z.coerce.number().min(0).default(0),
  thumbnail: z.string().optional(),
  floorPlan360: z.string().optional(),
  status: z.enum(["UPCOMING", "OPEN", "SOLD_OUT", "COMPLETED"]).default("UPCOMING"),
  launchDate: z.coerce.date().optional(),
  completionDate: z.coerce.date().optional(),
  commissionRate: z.coerce.number().min(0).max(100).optional(),
});

export const projectUpdateSchema = projectCreateSchema.partial();

export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;

// Property validation schema
export const propertyCreateSchema = z.object({
  code: z.string().min(2, "Mã căn ít nhất 2 ký tự"),
  projectId: z.string().uuid("Project ID không hợp lệ"),
  building: z.string().optional(),
  floor: z.coerce.number().optional(),
  unit: z.string().optional(),
  propertyType: z.enum(["APARTMENT", "VILLA", "TOWNHOUSE", "SHOPHOUSE", "LAND", "OFFICE"]),
  area: z.coerce.number().min(1, "Diện tích phải lớn hơn 0"),
  bedrooms: z.coerce.number().min(0).optional(),
  bathrooms: z.coerce.number().min(0).optional(),
  direction: z.string().optional(),
  view: z.string().optional(),
  price: z.coerce.number().min(0, "Giá phải lớn hơn 0"),
  pricePerSqm: z.coerce.number().optional(),
  status: z.enum(["AVAILABLE", "HOLD", "BOOKED", "SOLD", "UNAVAILABLE"]).default("AVAILABLE"),
  floorPlan: z.string().optional(),
});

export const propertyUpdateSchema = propertyCreateSchema.partial().omit({ projectId: true });

export type PropertyCreateInput = z.infer<typeof propertyCreateSchema>;
export type PropertyUpdateInput = z.infer<typeof propertyUpdateSchema>;

// Search params schema
export const propertySearchSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  projectId: z.string().optional(),
  status: z.string().optional(),
  propertyType: z.string().optional(),
  building: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  minArea: z.coerce.number().optional(),
  maxArea: z.coerce.number().optional(),
  bedrooms: z.coerce.number().optional(),
  search: z.string().optional(),
});

export type PropertySearchParams = z.infer<typeof propertySearchSchema>;
