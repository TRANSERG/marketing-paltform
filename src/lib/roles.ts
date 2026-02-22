import { createClient } from "@/lib/supabase/server";

export { ALL_PERMISSIONS } from "@/lib/permissions";
export type { Permission } from "@/lib/permissions";

export interface RoleWithPermissions {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  permissions: string[];
}

/** List all roles with their permissions. Requires users.manage. */
export async function getRolesWithPermissions(): Promise<RoleWithPermissions[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data: callerRoles } = await supabase
    .from("user_roles")
    .select("role_id")
    .eq("user_id", user.id);
  const roleIds = (callerRoles ?? []).map((r) => r.role_id);
  if (roleIds.length === 0) return [];
  const { data: perms } = await supabase
    .from("role_permissions")
    .select("role_id")
    .eq("permission", "users.manage")
    .in("role_id", roleIds);
  if (!perms?.length) return [];

  const { data: roles } = await supabase.from("roles").select("id, name, description, created_at").order("name");
  if (!roles?.length) return [];
  const roleIdsList = roles.map((r) => r.id);
  const { data: rolePerms } = await supabase
    .from("role_permissions")
    .select("role_id, permission")
    .in("role_id", roleIdsList);
  const permsByRole: Record<string, string[]> = {};
  for (const rp of rolePerms ?? []) {
    if (!permsByRole[rp.role_id]) permsByRole[rp.role_id] = [];
    permsByRole[rp.role_id].push(rp.permission);
  }
  return roles.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description ?? null,
    created_at: r.created_at,
    permissions: permsByRole[r.id] ?? [],
  }));
}

/** Get one role by id with permissions. Requires users.manage. */
export async function getRoleById(roleId: string): Promise<RoleWithPermissions | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: callerRoles } = await supabase
    .from("user_roles")
    .select("role_id")
    .eq("user_id", user.id);
  const roleIds = (callerRoles ?? []).map((r) => r.role_id);
  if (roleIds.length === 0) return null;
  const { data: perms } = await supabase
    .from("role_permissions")
    .select("role_id")
    .eq("permission", "users.manage")
    .in("role_id", roleIds);
  if (!perms?.length) return null;

  const { data: role } = await supabase.from("roles").select("id, name, description, created_at").eq("id", roleId).single();
  if (!role) return null;
  const { data: rolePerms } = await supabase.from("role_permissions").select("permission").eq("role_id", roleId);
  return {
    id: role.id,
    name: role.name,
    description: role.description ?? null,
    created_at: role.created_at,
    permissions: (rolePerms ?? []).map((p) => p.permission),
  };
}

/** Count users assigned to a role. */
export async function countUsersWithRole(roleId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("role_id", roleId);
  return count ?? 0;
}

/** Get user count per role (for list UI). Caller must have users.manage. */
export async function getRoleUserCounts(): Promise<Record<string, number>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return {};
  const { data: callerRoles } = await supabase
    .from("user_roles")
    .select("role_id")
    .eq("user_id", user.id);
  const roleIds = (callerRoles ?? []).map((r) => r.role_id);
  if (roleIds.length === 0) return {};
  const { data: perms } = await supabase
    .from("role_permissions")
    .select("role_id")
    .eq("permission", "users.manage")
    .in("role_id", roleIds);
  if (!perms?.length) return {};

  const { data: rows } = await supabase
    .from("user_roles")
    .select("role_id");
  const counts: Record<string, number> = {};
  for (const row of rows ?? []) {
    counts[row.role_id] = (counts[row.role_id] ?? 0) + 1;
  }
  return counts;
}
