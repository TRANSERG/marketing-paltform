import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createNextOccurrence } from "@/lib/tasks";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await createNextOccurrence(taskId);
  if ("error" in result) {
    return NextResponse.json(
      { error: result.error },
      { status: result.error === "Task not found" ? 404 : 400 }
    );
  }
  return NextResponse.json({ taskId: result.taskId });
}
