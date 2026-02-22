import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface AdminUserListRow {
  id: string;
  email: string | null;
  display_name: string | null;
  roles: string[];
}

const DEFAULT_USERS_PAGE_SIZE = 50;

export interface GetAdminUsersListResult {
  users: AdminUserListRow[];
  hasMore: boolean;
  page: number;
  perPage: number;
}

/** List users with email and roles (paginated). Requires users.manage. Returns empty if not allowed or no service role. */
export async function getAdminUsersList(opts?: {
  page?: number;
  perPage?: number;
}): Promise<GetAdminUsersListResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { users: [], hasMore: false, page: 1, perPage: DEFAULT_USERS_PAGE_SIZE };
  const { data: callerRoles } = await supabase
    .from("user_roles")
    .select("role_id")
    .eq("user_id", user.id);
  const roleIds = (callerRoles ?? []).map((r) => r.role_id);
  if (roleIds.length === 0) return { users: [], hasMore: false, page: 1, perPage: DEFAULT_USERS_PAGE_SIZE };
  const { data: perms } = await supabase
    .from("role_permissions")
    .select("role_id")
    .eq("permission", "users.manage")
    .in("role_id", roleIds);
  if (!perms?.length) return { users: [], hasMore: false, page: 1, perPage: DEFAULT_USERS_PAGE_SIZE };

  const page = Math.max(1, opts?.page ?? 1);
  const perPage = Math.min(100, Math.max(1, opts?.perPage ?? DEFAULT_USERS_PAGE_SIZE));

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return { users: [], hasMore: false, page, perPage };
  }
  const { data: authData, error: authError } = await admin.auth.admin.listUsers({
    perPage,
    page,
  });
  if (authError || !authData?.users?.length) {
    return { users: [], hasMore: false, page, perPage };
  }
  const users = authData.users;
  const userIds = users.map((u) => u.id);
  const { data: profiles } = await admin.from("profiles").select("id, display_name").in("id", userIds);
  const { data: userRoles } = await admin.from("user_roles").select("user_id, role_id").in("user_id", userIds);
  const { data: roles } = await admin.from("roles").select("id, name");
  const roleMap = Object.fromEntries((roles ?? []).map((r) => [r.id, r.name]));
  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));
  const rolesByUser: Record<string, string[]> = {};
  for (const ur of userRoles ?? []) {
    if (!rolesByUser[ur.user_id]) rolesByUser[ur.user_id] = [];
    const name = roleMap[ur.role_id];
    if (name) rolesByUser[ur.user_id].push(name);
  }
  const rows: AdminUserListRow[] = users.map((u) => ({
    id: u.id,
    email: u.email ?? null,
    display_name: profileMap[u.id]?.display_name ?? null,
    roles: rolesByUser[u.id] ?? [],
  }));
  const hasMore = users.length === perPage;
  return { users: rows, hasMore, page, perPage };
}

export async function getRoles(): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("roles").select("id, name").order("name");
  return (data ?? []) as { id: string; name: string }[];
}

export async function getProfileDisplayName(userId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .single();
  return data?.display_name ?? null;
}

export interface OpsUser {
  id: string;
  display_name: string | null;
}

/** Users with ops role (for assignment dropdown). Requires users.manage or clients.assign_ops. */
export async function getOpsUsers(): Promise<OpsUser[]> {
  const supabase = await createClient();
  const { data: roles } = await supabase
    .from("roles")
    .select("id")
    .eq("name", "ops")
    .limit(1)
    .single();
  if (!roles?.id) return [];
  const { data: userRoles } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("role_id", roles.id);
  const userIds = (userRoles ?? []).map((r) => r.user_id);
  if (userIds.length === 0) return [];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", userIds)
    .order("display_name");
  return (profiles ?? []).map((p) => ({
    id: p.id,
    display_name: p.display_name ?? p.id.slice(0, 8),
  }));
}

export interface AssignableUser {
  id: string;
  display_name: string | null;
}

/** All users with any role (for client assignment dropdown). Requires users.manage or clients.assign_ops. */
export async function getAssignableUsers(): Promise<AssignableUser[]> {
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
    .in("permission", ["clients.assign_ops", "users.manage"])
    .in("role_id", roleIds);
  if (!perms?.length) return [];

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return [];
  }
  const { data: userRoles } = await admin.from("user_roles").select("user_id");
  const userIds = [...new Set((userRoles ?? []).map((r) => r.user_id))];
  if (userIds.length === 0) return [];
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, display_name")
    .in("id", userIds)
    .order("display_name");
  return (profiles ?? []).map((p) => ({
    id: p.id,
    display_name: p.display_name ?? p.id.slice(0, 8),
  }));
}
