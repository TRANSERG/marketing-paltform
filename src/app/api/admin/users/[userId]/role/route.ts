import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** PATCH: Set user's role. Body: { role_id }. Replaces existing roles for that user. Requires users.manage. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
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
