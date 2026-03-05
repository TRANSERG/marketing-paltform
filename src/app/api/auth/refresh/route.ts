import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/auth/refresh
 * Refreshes the session using the refresh token in cookies.
 * Call this when the client detects an expired token (e.g. 401) or to proactively refresh.
 */
export async function POST() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.refreshSession();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    session: data.session != null,
  });
}
