import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const url = request.headers.get("origin") ?? request.headers.get("referer") ?? "/";
  const base = new URL(url).origin;
  return NextResponse.redirect(`${base}/`, { status: 302 });
}
