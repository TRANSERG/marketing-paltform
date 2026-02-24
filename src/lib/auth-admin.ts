import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { hasPermission } from "@/types/auth";

export type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

/**
 * Require users.manage permission. Uses JWT claims (no DB round-trips for auth).
 * Returns the Supabase client so callers can reuse it and avoid duplicate createClient/getUser.
 */
export async function requireUsersManage(): Promise<
  | { error: NextResponse }
  | { ok: true; supabase: ServerSupabase }
> {
  const user = await getAuthUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (!hasPermission(user, "users.manage")) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  const supabase = await createClient();
  return { ok: true, supabase };
}
