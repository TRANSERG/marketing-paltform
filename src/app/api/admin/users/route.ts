import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUsersManage } from "@/lib/auth-admin";

/** POST: Create a new user with email, password, optional display name, and role. Requires users.manage. */
export async function POST(request: Request) {
  const check = await requireUsersManage();
  if ("error" in check) return check.error;

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

/** GET: List users with email and roles (paginated). Query: page, perPage. Requires admin (users.manage). */
export async function GET(request: Request) {
  const check = await requireUsersManage();
  if ("error" in check) return check.error;
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get("perPage") ?? "50", 10) || 50));

  const { getAdminUsersList } = await import("@/lib/users");
  const result = await getAdminUsersList({ page, perPage }, check.supabase);
  return NextResponse.json({
    users: result.users,
    hasMore: result.hasMore,
    page: result.page,
    perPage: result.perPage,
  });
}
