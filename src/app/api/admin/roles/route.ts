import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUsersManage } from "@/lib/auth-admin";
import { getRolesWithPermissions, ALL_PERMISSIONS } from "@/lib/roles";

/** GET: List all roles with permissions. Requires users.manage. */
export async function GET() {
  const check = await requireUsersManage();
  if ("error" in check) return check.error;
  const roles = await getRolesWithPermissions(check.supabase);
  return NextResponse.json({ roles });
}

/** POST: Create a role. Body: { name, description?, permissions: string[] }. Requires users.manage. */
export async function POST(request: Request) {
  const check = await requireUsersManage();
  if ("error" in check) return check.error;

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
