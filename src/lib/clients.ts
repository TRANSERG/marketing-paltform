import { createClient } from "@/lib/supabase/server";
import type { Client, ClientStatus, ClientServiceWithDetails } from "@/types/database";

const CLIENT_LIST_COLS =
  "id, name, contact_email, contact_phone, address, timezone, status, created_by, assigned_ops_id, sold_at, activated_at, created_at, updated_at";

export async function getClients(
  filters?: { status?: ClientStatus },
  opts?: { limit?: number; offset?: number }
): Promise<Client[]> {
  const supabase = await createClient();
  let query = supabase
    .from("clients")
    .select(CLIENT_LIST_COLS)
    .order("created_at", { ascending: false });
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (opts?.limit != null) {
    query = query.range(
      opts.offset ?? 0,
      (opts.offset ?? 0) + opts.limit - 1
    );
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
  const [clientResult, clientServicesResult] = await Promise.all([
    supabase
      .from("clients")
      .select("id, name, contact_email, contact_phone, address, timezone, status, created_by, assigned_ops_id, sold_at, activated_at, created_at, updated_at")
      .eq("id", id)
      .single(),
    supabase
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
      .eq("client_id", id),
  ]);

  const { data: client, error: clientError } = clientResult;
  if (clientError || !client) return { client: null, clientServices: [] };

  const { data: clientServices, error: csError } = clientServicesResult;
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
  const results = await Promise.all(
    statuses.map(async (status) => {
      const { count, error } = await supabase
        .from("clients")
        .select("id", { count: "exact", head: true })
        .eq("status", status);
      return { status, count: error ? 0 : (count ?? 0) };
    })
  );
  return Object.fromEntries(results.map((r) => [r.status, r.count]));
}

export async function getClientsCount(filters?: { status?: ClientStatus }): Promise<number> {
  const supabase = await createClient();
  let query = supabase
    .from("clients")
    .select("id", { count: "exact", head: true });
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}
