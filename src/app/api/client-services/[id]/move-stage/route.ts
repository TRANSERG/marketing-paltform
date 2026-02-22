import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clientServiceId } = await params;
  const body = await request.json().catch(() => ({}));
  const serviceStageId = body.service_stage_id as string | undefined;
  if (!serviceStageId) {
    return NextResponse.json({ error: "service_stage_id required" }, { status: 400 });
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: existing } = await supabase
    .from("client_service_stages")
    .select("id")
    .eq("client_service_id", clientServiceId)
    .single();
  if (existing) {
    const { error } = await supabase
      .from("client_service_stages")
      .update({ service_stage_id: serviceStageId, entered_at: new Date().toISOString() })
      .eq("client_service_id", clientServiceId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  } else {
    const { error } = await supabase
      .from("client_service_stages")
      .insert({
        client_service_id: clientServiceId,
        service_stage_id: serviceStageId,
      });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }
  return NextResponse.json({ ok: true });
}
