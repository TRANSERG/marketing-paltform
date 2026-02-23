import { createClient } from "@/lib/supabase/server";
import type {
  Service,
  ServiceStage,
  TaskTemplate,
  TaskTemplateChecklistItem,
  TaskTemplateField,
} from "@/types/database";

export interface ServiceWithStages extends Service {
  service_stages: ServiceStage[];
}

export interface ServiceWithTaskTemplates extends Service {
  task_templates: (TaskTemplate & {
    task_template_checklist?: TaskTemplateChecklistItem[];
    task_template_fields?: TaskTemplateField[];
  })[];
}

export async function getServicesForFilter(): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .select("id, name")
    .order("name");
  if (error) throw error;
  return (data ?? []) as { id: string; name: string }[];
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

export async function getServicesWithTaskTemplates(): Promise<
  ServiceWithTaskTemplates[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .select(
      `
      id,
      name,
      description,
      created_at,
      task_templates(
        id,
        service_id,
        name,
        description,
        sort_order,
        default_due_offset_days,
        is_recurring,
        recurrence_interval,
        recurrence_interval_count,
        created_at,
        updated_at,
        task_template_checklist(id, task_template_id, label, sort_order, created_at),
        task_template_fields(id, task_template_id, key, label, field_type, sort_order, required, options, created_at, updated_at)
      )
    `
    )
    .order("name");
  if (error) throw error;
  const list = (data ?? []) as (Service & {
    task_templates: (TaskTemplate & {
      task_template_checklist?: TaskTemplateChecklistItem[];
      task_template_fields?: TaskTemplateField[];
    })[];
  })[];
  return list.map((s) => ({
    ...s,
    task_templates: (s.task_templates ?? []).map((t) => ({
      ...t,
      task_template_fields: (t.task_template_fields ?? []).sort(
        (a, b) => a.sort_order - b.sort_order
      ),
    })).sort((a, b) => a.sort_order - b.sort_order),
  }));
}

export async function getServiceById(
  id: string
): Promise<ServiceWithTaskTemplates | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .select(
      `
      id,
      name,
      description,
      created_at,
      task_templates(
        id,
        service_id,
        name,
        description,
        sort_order,
        default_due_offset_days,
        is_recurring,
        recurrence_interval,
        recurrence_interval_count,
        created_at,
        updated_at,
        task_template_checklist(id, task_template_id, label, sort_order, created_at),
        task_template_fields(id, task_template_id, key, label, field_type, sort_order, required, options, created_at, updated_at)
      )
    `
    )
    .eq("id", id)
    .single();
  if (error || !data) return null;
  const s = data as Service & {
    task_templates: (TaskTemplate & {
      task_template_checklist?: TaskTemplateChecklistItem[];
      task_template_fields?: TaskTemplateField[];
    })[];
  };
  return {
    ...s,
    task_templates: (s.task_templates ?? []).map((t) => ({
      ...t,
      task_template_fields: (t.task_template_fields ?? []).sort(
        (a, b) => a.sort_order - b.sort_order
      ),
    })).sort((a, b) => a.sort_order - b.sort_order),
  };
}

/** Returns service_id -> number of client_services (clients using that service). */
export async function getClientServiceCounts(): Promise<Record<string, number>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("client_services")
    .select("service_id");
  if (error) return {};
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const id = (row as { service_id: string }).service_id;
    counts[id] = (counts[id] ?? 0) + 1;
  }
  return counts;
}
