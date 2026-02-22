import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireUsersManage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const { data: callerRoles } = await supabase
    .from("user_roles")
    .select("role_id")
    .eq("user_id", user.id);
  const roleIds = (callerRoles ?? []).map((r) => r.role_id);
  if (roleIds.length === 0) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  const { data: perms } = await supabase
    .from("role_permissions")
    .select("role_id")
    .eq("permission", "users.manage")
    .in("role_id", roleIds);
  if (!perms?.length) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { ok: true as const };
}

/** POST: Create a new user with email, password, optional display name, and role. Requires users.manage. */
export async function POST(request: Request) {
  const check = await requireUsersManage();
  if (check.error) return check.error;

  const body = await request.json().catch(() => ({}));
  const email = body.email as string | undefined;
  const password = body.password as string | undefined;
  const displayName = body.display_name as string | undefined;
  const roleId = body.role_id as string | undefined;
  if (!email?.trim() || !password) {
    return NextResponse.json({ error: "email and password required" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }
  if (!roleId) {
    return NextResponse.json({ error: "role_id required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: newUser, error: createError } = await admin.auth.admin.createUser({
    email: email.trim(),
    password,
    email_confirm: true,
    user_metadata: displayName?.trim() ? { full_name: displayName.trim() } : undefined,
  });
  if (createError) {
    return NextResponse.json({ error: createError.message }, { status: 400 });
  }
  if (!newUser?.user?.id) {
    return NextResponse.json({ error: "Create user did not return user" }, { status: 500 });
  }
  const { error: roleError } = await admin
    .from("user_roles")
    .insert({ user_id: newUser.user.id, role_id: roleId });
  if (roleError) {
    return NextResponse.json({ error: roleError.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true, user_id: newUser.user.id });
}

/** GET: List all users with email and roles. Requires admin (users.manage). */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: callerRoles } = await supabase
    .from("user_roles")
    .select("role_id")
    .eq("user_id", user.id);
  const roleIds = (callerRoles ?? []).map((r) => r.role_id);
  if (roleIds.length === 0) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { data: perms } = await supabase
    .from("role_permissions")
    .select("role_id")
    .eq("permission", "users.manage")
    .in("role_id", roleIds);
  if (!perms?.length) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: authData, error: authError } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 });
  }
  const users = authData?.users ?? [];
  const userIds = users.map((u) => u.id);
  if (userIds.length === 0) {
    return NextResponse.json({ users: [] });
  }
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, display_name")
    .in("id", userIds);
  const { data: userRoles } = await admin
    .from("user_roles")
    .select("user_id, role_id")
    .in("user_id", userIds);
  const { data: roles } = await admin.from("roles").select("id, name");
  const roleMap = Object.fromEntries((roles ?? []).map((r) => [r.id, r.name]));
  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));
  const rolesByUser: Record<string, string[]> = {};
  for (const ur of userRoles ?? []) {
    if (!rolesByUser[ur.user_id]) rolesByUser[ur.user_id] = [];
    const name = roleMap[ur.role_id];
    if (name) rolesByUser[ur.user_id].push(name);
  }
  const list = users.map((u) => ({
    id: u.id,
    email: u.email ?? null,
    display_name: profileMap[u.id]?.display_name ?? null,
    roles: rolesByUser[u.id] ?? [],
  }));
  return NextResponse.json({ users: list });
}
