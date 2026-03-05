import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;
  const body = await request.json().catch(() => ({}));
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const updates: Record<string, unknown> = {};
  if (typeof body.status === "string") updates.status = body.status;
  if (typeof body.due_date === "string" || body.due_date === null)
    updates.due_date = body.due_date;
  if (typeof body.description === "string" || body.description === null)
    updates.description = body.description;
  if (typeof body.output === "string" || body.output === null)
    updates.output = body.output;
  if (body.output_data !== undefined) {
    if (body.output_data !== null && typeof body.output_data !== "object") {
      return NextResponse.json({ error: "output_data must be an object or null" }, { status: 400 });
    }
    updates.output_data = body.output_data;
  }

  if (body.assignee_id !== undefined) {
    const assigneeId = body.assignee_id === null || body.assignee_id === "" ? null : body.assignee_id;
    if (assigneeId !== null && typeof assigneeId !== "string") {
      return NextResponse.json({ error: "assignee_id must be a string or null" }, { status: 400 });
    }
    updates.assignee_id = assigneeId;
    const { data: currentTask } = await supabase
      .from("tasks")
      .select("assignee_id")
      .eq("id", taskId)
      .single();
    if (currentTask && (currentTask as { assignee_id: string | null }).assignee_id !== assigneeId) {
      updates.assigned_by_id = user.id;
    }
  }

  const hasTaskUpdates = Object.keys(updates).length > 0;
  const viewersProvided = Array.isArray(body.viewers);

  if (!hasTaskUpdates && !viewersProvided) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  if (hasTaskUpdates) {
    updates.updated_at = new Date().toISOString();
    if (body.status === "completed") {
      updates.completed_at = new Date().toISOString();
    } else if (body.status && body.status !== "completed") {
      updates.completed_at = null;
    }

    const { data, error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", taskId)
      .select("id, status, due_date, description, output, output_data, completed_at, updated_at, assignee_id, assigned_by_id")
      .single();

    if (error) {
      const status = error.code === "PGRST116" ? 404 : 403;
      return NextResponse.json({ error: error.message }, { status });
    }

    if (viewersProvided) {
      await supabase.from("task_viewers").delete().eq("task_id", taskId);
      const viewerIds = [...new Set((body.viewers as string[]).filter((id): id is string => typeof id === "string" && id.length > 0))];
      if (viewerIds.length > 0) {
        await supabase.from("task_viewers").insert(
          viewerIds.map((user_id) => ({ task_id: taskId, user_id }))
        );
      }
    }

    return NextResponse.json(data);
  }

  if (viewersProvided) {
    const { error: deleteError } = await supabase.from("task_viewers").delete().eq("task_id", taskId);
    if (deleteError) {
      const status = deleteError.code === "PGRST116" ? 404 : 403;
      return NextResponse.json({ error: deleteError.message }, { status: 403 });
    }
    const viewerIds = [...new Set((body.viewers as string[]).filter((id): id is string => typeof id === "string" && id.length > 0))];
    if (viewerIds.length > 0) {
      const { error: insertError } = await supabase.from("task_viewers").insert(
        viewerIds.map((user_id) => ({ task_id: taskId, user_id }))
      );
      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 403 });
      }
    }
    const { data: task } = await supabase.from("tasks").select("id").eq("id", taskId).single();
    return NextResponse.json(task ?? { id: taskId });
  }

  return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
}
