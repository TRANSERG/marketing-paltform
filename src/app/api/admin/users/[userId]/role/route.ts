import { NextResponse } from "next/server";
import { requireUsersManage } from "@/lib/auth-admin";

/** PATCH: Set user's role. Body: { role_id }. Replaces existing roles for that user. Requires users.manage. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const check = await requireUsersManage();
  if ("error" in check) return check.error;
  const { userId } = await params;
  const supabase = check.supabase;

  const body = await request.json().catch(() => ({}));
  const roleId = body.role_id as string | undefined;
  if (!roleId) {
    return NextResponse.json({ error: "role_id required" }, { status: 400 });
  }

  const { error: delError } = await supabase
    .from("user_roles")
    .delete()
    .eq("user_id", userId);
  if (delError) {
    return NextResponse.json({ error: delError.message }, { status: 400 });
  }
  const { error: insertError } = await supabase
    .from("user_roles")
    .insert({ user_id: userId, role_id: roleId });
  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
