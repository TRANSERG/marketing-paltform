import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const assignedOpsId = body.assigned_ops_id === null || body.assigned_ops_id === "" ? null : body.assigned_ops_id;
  if (assignedOpsId !== null && typeof assignedOpsId !== "string") {
    return NextResponse.json({ error: "Invalid assigned_ops_id" }, { status: 400 });
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { error } = await supabase
    .from("clients")
    .update({ assigned_ops_id: assignedOpsId })
    .eq("id", id);
  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.code === "PGRST116" ? 404 : 400 }
    );
  }
  return NextResponse.json({ ok: true });
}
