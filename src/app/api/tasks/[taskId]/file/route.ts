import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** GET ?path=... redirects to a signed URL for that storage path. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path");
  if (!path) {
    return NextResponse.json({ error: "path is required" }, { status: 400 });
  }
  if (!path.startsWith(taskId + "/")) {
    return NextResponse.json({ error: "path must be under this task" }, { status: 400 });
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase.storage
    .from("task-attachments")
    .createSignedUrl(path, 3600);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.redirect(data.signedUrl);
}
