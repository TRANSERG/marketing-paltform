import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUsersManage } from "@/lib/auth-admin";
import { getRoleById, countUsersWithRole, ALL_PERMISSIONS } from "@/lib/roles";

/** GET: Get one role with permissions. Requires users.manage. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ roleId: string }> }
) {
  const check = await requireUsersManage();
  if ("error" in check) return check.error;
  const { roleId } = await params;
  const [role, userCount] = await Promise.all([
    getRoleById(roleId, check.supabase),
    countUsersWithRole(roleId, check.supabase),
  ]);
  if (!role) return NextResponse.json({ error: "Role not found" }, { status: 404 });
  return NextResponse.json({ role, user_count: userCount });
}

/** PATCH: Update role. Body: { name?, description?, permissions?: string[] }. Requires users.manage. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ roleId: string }> }
) {
  const check = await requireUsersManage();
  if ("error" in check) return check.error;
  const { roleId } = await params;
  const supabase = check.supabase;

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
  const role = await getRoleById(roleId, supabase);
  return NextResponse.json({ role });
}

/** DELETE: Delete role. Fails if any user has this role. Requires users.manage. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ roleId: string }> }
) {
  const check = await requireUsersManage();
  if ("error" in check) return check.error;
  const { roleId } = await params;

  const userCount = await countUsersWithRole(roleId, check.supabase);
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
