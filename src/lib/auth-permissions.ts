import { UserRole } from "@/generated/prisma";

// Permission types for the CRM system
export type Permission =
  | "users:read"
  | "users:write"
  | "customers:read"
  | "customers:write"
  | "customers:delete"
  | "properties:read"
  | "properties:write"
  | "bookings:read"
  | "bookings:write"
  | "transactions:read"
  | "transactions:write"
  | "reports:read"
  | "settings:write"
  | "events:read"
  | "events:write"
  | "tasks:read"
  | "tasks:write"
  | "chat:read"
  | "chat:write";

// Role-based permission mapping
const rolePermissions: Record<UserRole, Permission[]> = {
  ADMIN: [
    "users:read",
    "users:write",
    "customers:read",
    "customers:write",
    "customers:delete",
    "properties:read",
    "properties:write",
    "bookings:read",
    "bookings:write",
    "transactions:read",
    "transactions:write",
    "reports:read",
    "settings:write",
    "events:read",
    "events:write",
    "tasks:read",
    "tasks:write",
    "chat:read",
    "chat:write",
  ],
  MANAGER: [
    "users:read",
    "customers:read",
    "customers:write",
    "properties:read",
    "properties:write",
    "bookings:read",
    "bookings:write",
    "reports:read",
    "events:read",
    "events:write",
    "tasks:read",
    "tasks:write",
    "chat:read",
    "chat:write",
  ],
  SALES: [
    "customers:read",
    "customers:write",
    "properties:read",
    "bookings:read",
    "bookings:write",
    "events:read",
    "tasks:read",
    "tasks:write",
    "chat:read",
    "chat:write",
  ],
  ACCOUNTANT: [
    "customers:read",
    "properties:read",
    "bookings:read",
    "transactions:read",
    "transactions:write",
    "reports:read",
    "tasks:read",
    "tasks:write",
  ],
  MARKETING: [
    "customers:read",
    "properties:read",
    "reports:read",
    "events:read",
    "events:write",
    "tasks:read",
    "tasks:write",
  ],
  SUPPORT: [
    "customers:read",
    "properties:read",
    "bookings:read",
    "events:read",
    "tasks:read",
    "chat:read",
    "chat:write",
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}

/**
 * Check if a role can access their own resources only
 */
export function canAccessOwnOnly(role: UserRole, resource: string): boolean {
  return role === "SALES" && ["customers", "bookings", "tasks"].includes(resource);
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return rolePermissions[role] ?? [];
}

/**
 * Check if role is admin or manager (elevated access)
 */
export function isElevatedRole(role: UserRole): boolean {
  return role === "ADMIN" || role === "MANAGER";
}

/**
 * Get role display name in Vietnamese
 */
export function getRoleDisplayName(role: UserRole): string {
  const names: Record<UserRole, string> = {
    ADMIN: "Quản trị viên",
    MANAGER: "Quản lý",
    SALES: "Nhân viên kinh doanh",
    ACCOUNTANT: "Kế toán",
    MARKETING: "Marketing",
    SUPPORT: "Hỗ trợ",
  };
  return names[role] ?? role;
}
