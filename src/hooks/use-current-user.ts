"use client";

import { useSession } from "@/lib/auth-client";
import { UserRole } from "@/generated/prisma";
import { hasPermission, Permission, isElevatedRole, getRoleDisplayName } from "@/lib/auth-permissions";

interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  fullName?: string;
  phone?: string;
  department?: string;
  position?: string;
  avatar?: string;
}

export function useCurrentUser() {
  const { data: session, isPending, error } = useSession();

  const user = session?.user as CurrentUser | undefined;
  const role = (user?.role as UserRole) ?? "SALES";

  /**
   * Check if user has a specific permission
   */
  const can = (permission: Permission): boolean => {
    if (!user?.role) return false;
    return hasPermission(role, permission);
  };

  /**
   * Check if user can access a resource (considering ownership)
   */
  const canAccess = (resource: string, ownerId?: string): boolean => {
    if (!user) return false;

    // Admin and Manager can access all
    if (isElevatedRole(role)) return true;

    // Others can only access their own resources
    if (ownerId && ownerId !== user.id) return false;

    return true;
  };

  return {
    user,
    isLoading: isPending,
    isAuthenticated: !!session?.user,
    error,
    role,
    roleDisplayName: getRoleDisplayName(role),
    isAdmin: role === "ADMIN",
    isManager: role === "MANAGER",
    isElevated: isElevatedRole(role),
    can,
    canAccess,
  };
}
