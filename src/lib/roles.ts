import { createClient } from "@/lib/supabase/server";
import type { ServerSupabase } from "@/lib/auth-admin";

export { ALL_PERMISSIONS } from "@/lib/permissions";
export type { Permission } from "@/lib/permissions";

export interface RoleWithPermissions {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  permissions: string[];
}

async function ensureSupabaseAndAuth(supabase?: ServerSupabase | null) {
  if (supabase) return supabase;
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return null;
  const { data: callerRoles } = await client
    .from("user_roles")
    .select("role_id")
    .eq("user_id", user.id);
  const roleIds = (callerRoles ?? []).map((r) => r.role_id);
  if (roleIds.length === 0) return null;
  const { data: perms } = await client
    .from("role_permissions")
    .select("role_id")
    .eq("permission", "users.manage")
    .in("role_id", roleIds);
  if (!perms?.length) return null;
  return client;
}

/** List all roles with their permissions. Pass supabase when caller already enforced users.manage. */
export async function getRolesWithPermissions(supabase?: ServerSupabase | null): Promise<RoleWithPermissions[]> {
  const client = await ensureSupabaseAndAuth(supabase);
  if (!client) return [];

  const [rolesRes, rolePermsRes] = await Promise.all([
    client.from("roles").select("id, name, description, created_at").order("name"),
    client.from("role_permissions").select("role_id, permission"),
  ]);
  const roles = rolesRes.data ?? [];
  const rolePerms = rolePermsRes.data ?? [];
  if (!roles.length) return [];

  const permsByRole: Record<string, string[]> = {};
  for (const rp of rolePerms) {
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

/** Get one role by id with permissions. Pass supabase when caller already enforced users.manage. */
export async function getRoleById(roleId: string, supabase?: ServerSupabase | null): Promise<RoleWithPermissions | null> {
  const client = await ensureSupabaseAndAuth(supabase);
  if (!client) return null;

  const [roleRes, rolePermsRes] = await Promise.all([
    client.from("roles").select("id, name, description, created_at").eq("id", roleId).single(),
    client.from("role_permissions").select("permission").eq("role_id", roleId),
  ]);
  const role = roleRes.data;
  const rolePerms = rolePermsRes.data ?? [];
  if (!role) return null;
  return {
    id: role.id,
    name: role.name,
    description: role.description ?? null,
    created_at: role.created_at,
    permissions: rolePerms.map((p) => p.permission),
  };
}

/** Count users assigned to a role. Pass supabase to avoid creating a new client. */
export async function countUsersWithRole(roleId: string, supabase?: ServerSupabase | null): Promise<number> {
  const client = supabase ?? (await createClient());
  const { count } = await client
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("role_id", roleId);
  return count ?? 0;
}

/** Get user count per role (for list UI). Caller must have users.manage. Pass supabase when already enforced. */
export async function getRoleUserCounts(supabase?: ServerSupabase | null): Promise<Record<string, number>> {
  const client = await ensureSupabaseAndAuth(supabase);
  if (!client) return {};

  const { data: rows } = await client.from("user_roles").select("role_id");
  const counts: Record<string, number> = {};
  for (const row of rows ?? []) {
    counts[row.role_id] = (counts[row.role_id] ?? 0) + 1;
  }
  return counts;
}
