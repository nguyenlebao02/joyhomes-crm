import db from "@/lib/db";
import { ProjectCreateInput, ProjectUpdateInput, PropertyCreateInput, PropertyUpdateInput, PropertySearchParams } from "@/lib/validators/inventory-validation-schema";
import { Prisma } from "@/generated/prisma";

// ==================== PROJECT SERVICES ====================

export async function getProjects(params: { status?: string; city?: string; search?: string }) {
  const where: Prisma.ProjectWhereInput = { deletedAt: null };

  if (params.status) where.status = params.status as Prisma.EnumProjectStatusFilter;
  if (params.city) where.city = { contains: params.city, mode: "insensitive" };
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: "insensitive" } },
      { code: { contains: params.search, mode: "insensitive" } },
      { location: { contains: params.search, mode: "insensitive" } },
    ];
  }

  return db.project.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { properties: true, bookings: true } },
    },
  });
}

export async function getProjectById(id: string) {
  return db.project.findFirst({
    where: { id, deletedAt: null },
    include: {
      properties: {
        orderBy: [{ building: "asc" }, { floor: "asc" }, { unit: "asc" }],
      },
      _count: { select: { properties: true, bookings: true } },
    },
  });
}

export async function createProject(data: ProjectCreateInput) {
  return db.project.create({ data });
}

export async function updateProject(id: string, data: ProjectUpdateInput) {
  return db.project.update({ where: { id }, data });
}

export async function deleteProject(id: string) {
  return db.project.update({ where: { id }, data: { deletedAt: new Date() } });
}

export async function getProjectStats() {
  const [total, byStatus, recentProjects] = await Promise.all([
    db.project.count({ where: { deletedAt: null } }),
    db.project.groupBy({ by: ["status"], where: { deletedAt: null }, _count: true }),
    db.project.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { _count: { select: { properties: true } } },
    }),
  ]);
  return { total, byStatus, recentProjects };
}

// ==================== PROPERTY SERVICES ====================

export async function getProperties(params: PropertySearchParams) {
  const { page, limit, projectId, status, propertyType, building, minPrice, maxPrice, minArea, maxArea, bedrooms, search } = params;

  const where: Prisma.PropertyWhereInput = {};

  if (projectId) where.projectId = projectId;
  if (status) where.status = status as Prisma.EnumPropertyStatusFilter;
  if (propertyType) where.propertyType = propertyType as Prisma.EnumPropertyTypeFilter;
  if (building) where.building = building;
  if (bedrooms) where.bedrooms = bedrooms;

  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = minPrice;
    if (maxPrice) where.price.lte = maxPrice;
  }

  if (minArea || maxArea) {
    where.area = {};
    if (minArea) where.area.gte = minArea;
    if (maxArea) where.area.lte = maxArea;
  }

  if (search) {
    where.OR = [
      { code: { contains: search, mode: "insensitive" } },
      { building: { contains: search, mode: "insensitive" } },
    ];
  }

  const skip = (page - 1) * limit;

  const [properties, total] = await Promise.all([
    db.property.findMany({
      where,
      take: limit,
      skip,
      orderBy: [{ building: "asc" }, { floor: "asc" }, { unit: "asc" }],
      include: {
        project: { select: { id: true, name: true, code: true } },
        _count: { select: { bookings: true } },
      },
    }),
    db.property.count({ where }),
  ]);

  return { properties, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getPropertyById(id: string) {
  return db.property.findUnique({
    where: { id },
    include: {
      project: true,
      bookings: { include: { customer: true }, take: 5 },
    },
  });
}

export async function createProperty(data: PropertyCreateInput) {
  const property = await db.property.create({ data });

  // Update project unit counts
  await updateProjectUnitCounts(data.projectId);

  return property;
}

export async function updateProperty(id: string, data: PropertyUpdateInput) {
  const property = await db.property.update({ where: { id }, data });

  // Update project unit counts if status changed
  if (data.status) {
    const prop = await db.property.findUnique({ where: { id } });
    if (prop) await updateProjectUnitCounts(prop.projectId);
  }

  return property;
}

export async function updatePropertyStatus(id: string, status: string) {
  const property = await db.property.update({
    where: { id },
    data: { status: status as "AVAILABLE" | "HOLD" | "BOOKED" | "SOLD" | "UNAVAILABLE" },
  });

  await updateProjectUnitCounts(property.projectId);

  return property;
}

export async function bulkUpdatePropertyStatus(ids: string[], status: string) {
  const result = await db.property.updateMany({
    where: { id: { in: ids } },
    data: { status: status as "AVAILABLE" | "HOLD" | "BOOKED" | "SOLD" | "UNAVAILABLE" },
  });

  // Get unique project IDs and update counts
  const properties = await db.property.findMany({ where: { id: { in: ids } }, select: { projectId: true } });
  const projectIds = [...new Set(properties.map((p) => p.projectId))];
  await Promise.all(projectIds.map(updateProjectUnitCounts));

  return result;
}

async function updateProjectUnitCounts(projectId: string) {
  const [totalUnits, availableUnits] = await Promise.all([
    db.property.count({ where: { projectId } }),
    db.property.count({ where: { projectId, status: "AVAILABLE" } }),
  ]);

  await db.project.update({
    where: { id: projectId },
    data: { totalUnits, availableUnits },
  });
}

export async function getPropertyStats(projectId?: string) {
  const where: Prisma.PropertyWhereInput = projectId ? { projectId } : {};

  const [total, byStatus, byType] = await Promise.all([
    db.property.count({ where }),
    db.property.groupBy({ by: ["status"], where, _count: true }),
    db.property.groupBy({ by: ["propertyType"], where, _count: true }),
  ]);

  return { total, byStatus, byType };
}
