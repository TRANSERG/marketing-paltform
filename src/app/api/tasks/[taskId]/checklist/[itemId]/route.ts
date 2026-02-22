import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ taskId: string; itemId: string }> }
) {
  const { taskId, itemId } = await params;
  const body = await request.json().catch(() => ({}));
  const completed = body.completed as boolean | undefined;
  if (typeof completed !== "boolean") {
    return NextResponse.json(
      { error: "completed (boolean) required" },
      { status: 400 }
    );
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const updates: Record<string, unknown> = {
    completed,
    ...(completed ? { completed_at: new Date().toISOString() } : { completed_at: null }),
  };

  const { data, error } = await supabase
    .from("task_checklist_items")
    .update(updates)
    .eq("id", itemId)
    .eq("task_id", taskId)
    .select("id, completed, completed_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json(data);
}
