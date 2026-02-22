import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; fieldId: string }> }
) {
  const { id: templateId, fieldId } = await params;
  const body = await request.json().catch(() => ({}));
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const updates: Record<string, unknown> = {};
  if (typeof body.key === "string") updates.key = body.key;
  if (typeof body.label === "string") updates.label = body.label;
  if (typeof body.field_type === "string") updates.field_type = body.field_type;
  if (typeof body.sort_order === "number") updates.sort_order = body.sort_order;
  if (typeof body.required === "boolean") updates.required = body.required;
  if (body.options !== undefined) updates.options = body.options;
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("task_template_fields")
    .update(updates)
    .eq("id", fieldId)
    .eq("task_template_id", templateId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json(data);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; fieldId: string }> }
) {
  const { id: templateId, fieldId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("task_template_fields")
    .delete()
    .eq("id", fieldId)
    .eq("task_template_id", templateId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
