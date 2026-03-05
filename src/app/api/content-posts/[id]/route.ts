import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { hasPermission } from "@/types/auth";
import type { PostPlatform, PostStatus } from "@/types/database";

/** PATCH: Update an existing content post. Requires clients.read permission. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getAuthUser();
  if (!user || (!hasPermission(user, "clients.read") && !user.user_roles?.includes("admin"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Partial<{
    platform: PostPlatform;
    caption: string;
    scheduled_at: string;
    status: PostStatus;
    notes: string | null;
  }>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("content_posts")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.code === "PGRST116" ? 404 : 400 }
    );
  }

  return NextResponse.json({ ok: true });
}

/** DELETE: Remove a content post. Requires clients.read permission. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getAuthUser();
  if (!user || (!hasPermission(user, "clients.read") && !user.user_roles?.includes("admin"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("content_posts")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.code === "PGRST116" ? 404 : 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
