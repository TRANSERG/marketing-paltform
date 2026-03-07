import { createClient } from "@/lib/supabase/server";
import type {
  ClientProfile,
  ClientProfileUpsert,
  ClientBrand,
  ClientBrandUpsert,
  ClientOffering,
  ClientOfferingInsert,
  ClientTeamMember,
  ClientTeamMemberInsert,
  ClientAsset,
  ClientAssetInsert,
} from "@/types/database";

// ─── Client Profile ──────────────────────────────────────────────────────────

export async function getClientProfile(clientId: string): Promise<ClientProfile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("client_profile")
    .select("*")
    .eq("client_id", clientId)
    .maybeSingle();
  if (error) throw error;
  return data as ClientProfile | null;
}

export async function upsertClientProfile(
  profile: ClientProfileUpsert
): Promise<ClientProfile> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("client_profile")
    .upsert({ ...profile, updated_at: new Date().toISOString() }, { onConflict: "client_id" })
    .select()
    .single();
  if (error) throw error;
  return data as ClientProfile;
}

// ─── Client Brand ────────────────────────────────────────────────────────────

export async function getClientBrand(clientId: string): Promise<ClientBrand | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("client_brand")
    .select("*")
    .eq("client_id", clientId)
    .maybeSingle();
  if (error) throw error;
  return data as ClientBrand | null;
}

export async function upsertClientBrand(brand: ClientBrandUpsert): Promise<ClientBrand> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("client_brand")
    .upsert({ ...brand, updated_at: new Date().toISOString() }, { onConflict: "client_id" })
    .select()
    .single();
  if (error) throw error;
  return data as ClientBrand;
}

// ─── Client Offerings ────────────────────────────────────────────────────────

export async function getClientOfferings(clientId: string): Promise<ClientOffering[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("client_offerings")
    .select("*")
    .eq("client_id", clientId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ClientOffering[];
}

export async function createClientOffering(
  offering: ClientOfferingInsert
): Promise<ClientOffering> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("client_offerings")
    .insert(offering)
    .select()
    .single();
  if (error) throw error;
  return data as ClientOffering;
}

export async function updateClientOffering(
  id: string,
  updates: Partial<ClientOfferingInsert>
): Promise<ClientOffering> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("client_offerings")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as ClientOffering;
}

export async function deleteClientOffering(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("client_offerings").delete().eq("id", id);
  if (error) throw error;
}

// ─── Client Team Members ─────────────────────────────────────────────────────

export async function getClientTeamMembers(clientId: string): Promise<ClientTeamMember[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("client_team_members")
    .select("*")
    .eq("client_id", clientId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ClientTeamMember[];
}

export async function createClientTeamMember(
  member: ClientTeamMemberInsert
): Promise<ClientTeamMember> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("client_team_members")
    .insert(member)
    .select()
    .single();
  if (error) throw error;
  return data as ClientTeamMember;
}

export async function updateClientTeamMember(
  id: string,
  updates: Partial<ClientTeamMemberInsert>
): Promise<ClientTeamMember> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("client_team_members")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as ClientTeamMember;
}

export async function deleteClientTeamMember(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("client_team_members").delete().eq("id", id);
  if (error) throw error;
}

// ─── Client Assets ───────────────────────────────────────────────────────────

export async function getClientAssets(
  clientId: string,
  filters?: { asset_type?: ClientAsset["asset_type"] }
): Promise<ClientAsset[]> {
  const supabase = await createClient();
  let query = supabase
    .from("client_assets")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  if (filters?.asset_type) {
    query = query.eq("asset_type", filters.asset_type);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ClientAsset[];
}

export async function createClientAsset(asset: ClientAssetInsert): Promise<ClientAsset> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("client_assets")
    .insert(asset)
    .select()
    .single();
  if (error) throw error;
  return data as ClientAsset;
}

export async function updateClientAsset(
  id: string,
  updates: Partial<Omit<ClientAssetInsert, "client_id" | "created_by" | "file_path">>
): Promise<ClientAsset> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("client_assets")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as ClientAsset;
}

export async function deleteClientAsset(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("client_assets").delete().eq("id", id);
  if (error) throw error;
}

// ─── Signed URL helper ───────────────────────────────────────────────────────

export async function getAssetSignedUrl(
  filePath: string,
  expiresIn = 3600
): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("client-assets")
    .createSignedUrl(filePath, expiresIn);
  if (error) return null;
  return data.signedUrl;
}
