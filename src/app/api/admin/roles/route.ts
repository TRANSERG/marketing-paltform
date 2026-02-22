import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRolesWithPermissions, ALL_PERMISSIONS } from "@/lib/roles";

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

/** GET: List all roles with permissions. Requires users.manage. */
export async function GET() {
  const check = await requireUsersManage();
  if (check.error) return check.error;
  const roles = await getRolesWithPermissions();
  return NextResponse.json({ roles });
}

/** POST: Create a role. Body: { name, description?, permissions: string[] }. Requires users.manage. */
export async function POST(request: Request) {
  const check = await requireUsersManage();
  if (check.error) return check.error;

  const body = await request.json().catch(() => ({}));
  const name = (body.name as string)?.trim();
  const description = typeof body.description === "string" ? body.description.trim() || null : null;
  const permissions = Array.isArray(body.permissions) ? (body.permissions as string[]) : [];

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const validPerms = permissions.filter((p) => (ALL_PERMISSIONS as readonly string[]).includes(p));

  const admin = createAdminClient();
  const { data: role, error: roleError } = await admin
    .from("roles")
    .insert({ name, description })
    .select("id, name, description, created_at")
    .single();
  if (roleError) {
    if (roleError.code === "23505") return NextResponse.json({ error: "Role name already exists" }, { status: 400 });
    return NextResponse.json({ error: roleError.message }, { status: 400 });
  }
  if (validPerms.length > 0) {
    const { error: permError } = await admin
      .from("role_permissions")
      .insert(validPerms.map((permission) => ({ role_id: role.id, permission })));
    if (permError) {
      await admin.from("roles").delete().eq("id", role.id);
      return NextResponse.json({ error: permError.message }, { status: 400 });
    }
  }
  return NextResponse.json({ role: { ...role, permissions: validPerms } });
}
