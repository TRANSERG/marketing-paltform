import { createClient } from "@/lib/supabase/server";
import type { Client, ClientStatus, ClientServiceWithDetails } from "@/types/database";

export async function getClients(filters?: { status?: ClientStatus }): Promise<Client[]> {
  const supabase = await createClient();
  let query = supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Client[];
}

export async function getClientById(id: string): Promise<{
  client: Client | null;
  clientServices: ClientServiceWithDetails[];
}> {
  const supabase = await createClient();
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();
  if (clientError || !client) return { client: null, clientServices: [] };
  const { data: clientServices, error: csError } = await supabase
    .from("client_services")
    .select(`
      id,
      client_id,
      service_id,
      status,
      created_at,
      updated_at,
      service:services(id, name, description),
      client_service_stages(
        id,
        service_stage_id,
        entered_at,
        notes,
        service_stage:service_stages(id, name, sort_order)
      )
    `)
    .eq("client_id", id);
  if (csError) return { client: client as Client, clientServices: [] };
  const mapped: ClientServiceWithDetails[] = (clientServices ?? []).map(
    (cs: Record<string, unknown>) => {
      const stages = cs.client_service_stages as Record<string, unknown>[] | undefined;
      const first = Array.isArray(stages) ? stages[0] : null;
      const stage = first?.service_stage as { id: string; name: string; sort_order: number } | undefined;
      return {
        id: cs.id as string,
        client_id: cs.client_id as string,
        service_id: cs.service_id as string,
        status: cs.status as ClientServiceWithDetails["status"],
        created_at: cs.created_at as string,
        updated_at: cs.updated_at as string,
        service: cs.service as { id: string; name: string; description: string | null },
        current_stage: stage ? { id: stage.id, name: stage.name, sort_order: stage.sort_order } : undefined,
      };
    }
  );
  return { client: client as Client, clientServices: mapped };
}

export async function getPipelineCounts(): Promise<Record<string, number>> {
  const supabase = await createClient();
  const statuses: ClientStatus[] = ["lead", "qualified", "closed", "active", "churned"];
  const counts: Record<string, number> = {};
  for (const status of statuses) {
    const { count, error } = await supabase
      .from("clients")
      .select("id", { count: "exact", head: true })
      .eq("status", status);
    if (!error) counts[status] = count ?? 0;
  }
  return counts;
}
