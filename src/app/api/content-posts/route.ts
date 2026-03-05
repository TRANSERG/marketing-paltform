import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { hasPermission } from "@/types/auth";
import type { PostPlatform, PostStatus } from "@/types/database";

/** POST: Create a new content post. Requires clients.read permission. */
export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user || (!hasPermission(user, "clients.read") && !user.user_roles?.includes("admin"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: {
    client_id: string;
    platform: PostPlatform;
    caption: string;
    scheduled_at: string;
    status: PostStatus;
    notes?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { client_id, platform, caption, scheduled_at, status, notes } = body;

  if (!client_id || !platform || !scheduled_at || !status) {
    return NextResponse.json(
      { error: "client_id, platform, scheduled_at, and status are required" },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("content_posts")
    .insert({
      client_id,
      platform,
      caption: caption ?? "",
      scheduled_at,
      status,
      notes: notes ?? null,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ post: data }, { status: 201 });
}
