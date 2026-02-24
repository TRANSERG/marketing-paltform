import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUsersManage } from "@/lib/auth-admin";

/** DELETE: Remove user (auth + profiles + user_roles). Requires users.manage. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const check = await requireUsersManage();
  if ("error" in check) return check.error;
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
