import { createClient } from "@/lib/supabase/server";
import type { Service, ServiceStage } from "@/types/database";

export interface ServiceWithStages extends Service {
  service_stages: ServiceStage[];
}

export async function getServicesWithStages(): Promise<ServiceWithStages[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .select(`
      id,
      name,
      description,
      created_at,
      service_stages(id, service_id, name, sort_order, created_at)
    `)
    .order("name");
  if (error) throw error;
  const list = (data ?? []) as (Service & { service_stages: ServiceStage[] })[];
  return list.map((s) => ({
    ...s,
    service_stages: (s.service_stages ?? []).sort(
      (a, b) => a.sort_order - b.sort_order
    ),
  }));
}
