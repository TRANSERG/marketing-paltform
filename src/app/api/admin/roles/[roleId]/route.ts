import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRoleById, countUsersWithRole } from "@/lib/roles";
import { ALL_PERMISSIONS } from "@/lib/roles";

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

/** GET: Get one role with permissions. Requires users.manage. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ roleId: string }> }
) {
  const check = await requireUsersManage();
  if (check.error) return check.error;
  const { roleId } = await params;
  const role = await getRoleById(roleId);
  if (!role) return NextResponse.json({ error: "Role not found" }, { status: 404 });
  const userCount = await countUsersWithRole(roleId);
  return NextResponse.json({ role, user_count: userCount });
}

/** PATCH: Update role. Body: { name?, description?, permissions?: string[] }. Requires users.manage. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ roleId: string }> }
) {
  const check = await requireUsersManage();
  if (check.error) return check.error;
  const { roleId } = await params;

  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : undefined;
  const description = typeof body.description === "string" ? body.description.trim() || null : undefined;
  const permissions = Array.isArray(body.permissions) ? (body.permissions as string[]) : undefined;

  const admin = createAdminClient();
  if (name !== undefined) {
    const { error: updateError } = await admin.from("roles").update({ name }).eq("id", roleId);
    if (updateError) {
      if (updateError.code === "23505") return NextResponse.json({ error: "Role name already exists" }, { status: 400 });
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }
  }
  if (description !== undefined) {
    const { error } = await admin.from("roles").update({ description }).eq("id", roleId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (permissions !== undefined) {
    const validPerms = permissions.filter((p) => (ALL_PERMISSIONS as readonly string[]).includes(p));
    const { error: delError } = await admin.from("role_permissions").delete().eq("role_id", roleId);
    if (delError) return NextResponse.json({ error: delError.message }, { status: 400 });
    if (validPerms.length > 0) {
      const { error: insertError } = await admin
        .from("role_permissions")
        .insert(validPerms.map((permission) => ({ role_id: roleId, permission })));
      if (insertError) return NextResponse.json({ error: insertError.message }, { status: 400 });
    }
  }
  const role = await getRoleById(roleId);
  return NextResponse.json({ role });
}

/** DELETE: Delete role. Fails if any user has this role. Requires users.manage. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ roleId: string }> }
) {
  const check = await requireUsersManage();
  if (check.error) return check.error;
  const { roleId } = await params;

  const userCount = await countUsersWithRole(roleId);
  if (userCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete role: ${userCount} user(s) have this role. Remove the role from all users first.` },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { error } = await admin.from("roles").delete().eq("id", roleId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
