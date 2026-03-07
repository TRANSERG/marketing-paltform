"use server";

import { createClient } from "@/lib/supabase/server";

export async function createTeamMemberAction(
  clientId: string,
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string } | undefined> {
  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Name is required" };

  const supabase = await createClient();
  const { error } = await supabase.from("client_team_members").insert({
    client_id:        clientId,
    name,
    role:             (formData.get("role") as string)?.trim() || null,
    bio:              (formData.get("bio") as string)?.trim() || null,
    specialties:      (formData.get("specialties") as string)?.split(",").map((s) => s.trim()).filter(Boolean) || null,
    instagram_handle: (formData.get("instagram_handle") as string)?.trim().replace(/^@/, "") || null,
    is_active:        formData.get("is_active") !== "false",
    sort_order:       formData.get("sort_order") ? parseInt(formData.get("sort_order") as string) : 0,
  });
  if (error) return { error: error.message };
}

export async function updateTeamMemberAction(
  id: string,
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string } | undefined> {
  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Name is required" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("client_team_members")
    .update({
      name,
      role:             (formData.get("role") as string)?.trim() || null,
      bio:              (formData.get("bio") as string)?.trim() || null,
      specialties:      (formData.get("specialties") as string)?.split(",").map((s) => s.trim()).filter(Boolean) || null,
      instagram_handle: (formData.get("instagram_handle") as string)?.trim().replace(/^@/, "") || null,
      is_active:        formData.get("is_active") !== "false",
      updated_at:       new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { error: error.message };
}

export async function deleteTeamMemberAction(id: string): Promise<{ error?: string } | undefined> {
  const supabase = await createClient();
  const { error } = await supabase.from("client_team_members").delete().eq("id", id);
  if (error) return { error: error.message };
}
