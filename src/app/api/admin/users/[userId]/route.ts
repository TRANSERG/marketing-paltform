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
  return { ok: true };
}

/** DELETE: Remove user (auth + profiles + user_roles). Requires users.manage. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const check = await requireUsersManage();
  if (check.error) return check.error;
  const { userId } = await params;

  const admin = createAdminClient();
  const { error: delRolesError } = await admin.from("user_roles").delete().eq("user_id", userId);
  if (delRolesError) {
    return NextResponse.json({ error: delRolesError.message }, { status: 400 });
  }
  const { error: delProfileError } = await admin.from("profiles").delete().eq("id", userId);
  if (delProfileError) {
    return NextResponse.json({ error: delProfileError.message }, { status: 400 });
  }
  const { error: authError } = await admin.auth.admin.deleteUser(userId);
  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
