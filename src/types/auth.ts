export type RoleName = "admin" | "sales" | "ops" | "client";

export interface AuthUser {
  id: string;
  email?: string;
  user_role?: RoleName;
  user_roles?: RoleName[];
  permissions?: string[];
}

export function hasPermission(user: AuthUser | null, permission: string): boolean {
  if (!user?.permissions) return false;
  return user.permissions.includes(permission);
}

export function hasRole(user: AuthUser | null, role: RoleName): boolean {
  if (!user?.user_roles?.length) return !!user?.user_role && user.user_role === role;
  return user.user_roles.includes(role);
}

export function isAdmin(user: AuthUser | null): boolean {
  return hasRole(user, "admin") || hasPermission(user, "users.manage");
}
