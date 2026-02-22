import { createClient } from "@/lib/supabase/server";
import type { Task, TaskWithDetails, TaskChecklistItem } from "@/types/database";

export async function getTasksByClientServiceId(
  clientServiceId: string
): Promise<TaskWithDetails[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select(
      `
      id,
      client_service_id,
      task_template_id,
      assignee_id,
      title,
      due_date,
      scheduled_at,
      status,
      output,
      output_data,
      completed_at,
      created_at,
      updated_at,
      task_template:task_templates(id, name, description, sort_order, default_due_offset_days, task_template_fields(id, task_template_id, key, label, field_type, sort_order, required, options, created_at, updated_at)),
      task_checklist_items(id, task_id, label, sort_order, completed, completed_at, created_at)
    `
    )
    .eq("client_service_id", clientServiceId)
    .order("due_date", { ascending: true, nullsFirst: false });
  if (error) throw error;
  const list = (data ?? []) as unknown as (Task & {
    task_template?: unknown;
    task_templates?: unknown;
    task_checklist_items: TaskChecklistItem[];
  })[];
  type TemplateShape = {
    id: string;
    name: string;
    description: string | null;
    sort_order: number;
    default_due_offset_days: number | null;
    task_template_fields?: { id: string; key: string; label: string; field_type: string; sort_order: number; required: boolean; options: unknown }[];
  };
  return list.map((t) => {
    const raw = t.task_template ?? t.task_templates;
    const template = Array.isArray(raw) ? raw[0] : raw;
    let safeTemplate: TemplateShape | undefined =
      template && typeof template === "object" && "id" in template
        ? (template as TemplateShape)
        : undefined;
    if (safeTemplate?.task_template_fields) {
      safeTemplate = {
        ...safeTemplate,
        task_template_fields: [...safeTemplate.task_template_fields].sort(
          (a, b) => a.sort_order - b.sort_order
        ),
      };
    }
    return {
      ...t,
      task_template: safeTemplate,
      task_checklist_items: (t.task_checklist_items ?? []).sort(
        (a, b) => a.sort_order - b.sort_order
      ),
    };
  }) as TaskWithDetails[];
}

export async function getTasksByClientId(
  clientId: string
): Promise<TaskWithDetails[]> {
  const supabase = await createClient();
  const { data: clientServices } = await supabase
    .from("client_services")
    .select("id")
    .eq("client_id", clientId);
  if (!clientServices?.length) return [];
  const all: TaskWithDetails[] = [];
  for (const cs of clientServices) {
    const tasks = await getTasksByClientServiceId(cs.id);
    all.push(...tasks);
  }
  all.sort((a, b) => {
    const da = a.due_date ? new Date(a.due_date).getTime() : Infinity;
    const db = b.due_date ? new Date(b.due_date).getTime() : Infinity;
    return da - db;
  });
  return all;
}

export async function getTaskById(
  taskId: string
): Promise<TaskWithDetails | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select(
      `
      id,
      client_service_id,
      task_template_id,
      assignee_id,
      title,
      due_date,
      scheduled_at,
      status,
      output,
      output_data,
      completed_at,
      created_at,
      updated_at,
      task_template:task_templates(id, service_id, name, description, sort_order, default_due_offset_days, task_template_fields(id, task_template_id, key, label, field_type, sort_order, required, options, created_at, updated_at)),
      task_checklist_items(id, task_id, label, sort_order, completed, completed_at, created_at)
    `
    )
    .eq("id", taskId)
    .single();
  if (error || !data) return null;
  const t = data as unknown as Task & {
    task_template?: unknown;
    task_templates?: unknown;
    task_checklist_items: TaskChecklistItem[];
  };
  const raw = t.task_template ?? t.task_templates;
  const template = Array.isArray(raw) ? raw[0] : raw;
  type TemplateShape = NonNullable<TaskWithDetails["task_template"]> & {
    task_template_fields?: { id: string; key: string; label: string; field_type: string; sort_order: number; required: boolean; options: unknown }[];
  };
  let safeTemplate: TemplateShape | undefined =
    template && typeof template === "object" && "id" in template
      ? (template as TemplateShape)
      : undefined;
  if (safeTemplate?.task_template_fields) {
    safeTemplate = {
      ...safeTemplate,
      task_template_fields: [...safeTemplate.task_template_fields].sort(
        (a, b) => a.sort_order - b.sort_order
      ),
    };
  }
  return {
    ...t,
    task_template: safeTemplate,
    task_checklist_items: (t.task_checklist_items ?? []).sort(
      (a, b) => a.sort_order - b.sort_order
    ),
  } as TaskWithDetails;
}

export async function createTasksForClientService(
  clientServiceId: string,
  serviceId: string,
  assigneeId: string | null
): Promise<void> {
  const supabase = await createClient();
  const { data: templates, error: templatesError } = await supabase
    .from("task_templates")
    .select(
      "id, name, default_due_offset_days, task_template_checklist(id, label, sort_order)"
    )
    .eq("service_id", serviceId)
    .order("sort_order", { ascending: true });
  if (templatesError || !templates?.length) return;

  const baseDate = new Date();
  for (let i = 0; i < templates.length; i++) {
    const tmpl = templates[i] as {
      id: string;
      name: string;
      default_due_offset_days: number | null;
      task_template_checklist?: { id: string; label: string; sort_order: number }[];
    };
    const offset = tmpl.default_due_offset_days ?? (i + 1) * 7;
    const dueDate = new Date(baseDate);
    dueDate.setDate(dueDate.getDate() + offset);
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .insert({
        client_service_id: clientServiceId,
        task_template_id: tmpl.id,
        assignee_id: assigneeId,
        title: tmpl.name,
        due_date: dueDate.toISOString().slice(0, 10),
        status: "scheduled",
      })
      .select("id")
      .single();
    if (taskError || !task) continue;
    const checklist = tmpl.task_template_checklist ?? [];
    if (checklist.length > 0) {
      await supabase.from("task_checklist_items").insert(
        checklist.map((c) => ({
          task_id: task.id,
          label: c.label,
          sort_order: c.sort_order,
        }))
      );
    }
  }
}
