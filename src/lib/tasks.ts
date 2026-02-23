import { createClient } from "@/lib/supabase/server";
import type {
  Task,
  TaskWithDetails,
  TaskWithClientContext,
  TaskChecklistItem,
  TaskRecurrenceInterval,
  GetTasksForCurrentUserOptions,
  GetTasksForCurrentUserResult,
} from "@/types/database";

/** Compute next due date from a reference date using template recurrence. */
export function nextDueDateFromRecurrence(
  fromDate: Date,
  interval: TaskRecurrenceInterval,
  count: number
): string {
  const d = new Date(fromDate);
  if (interval === "day") {
    d.setDate(d.getDate() + count);
  } else if (interval === "week") {
    d.setDate(d.getDate() + count * 7);
  } else {
    d.setMonth(d.getMonth() + count);
  }
  return d.toISOString().slice(0, 10);
}

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
      task_template:task_templates(id, name, description, sort_order, default_due_offset_days, is_recurring, recurrence_interval, recurrence_interval_count, task_template_fields(id, task_template_id, key, label, field_type, sort_order, required, options, created_at, updated_at)),
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

const TASKS_SELECT_WITH_CONTEXT = `
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
  task_template:task_templates(id, name, description, sort_order, default_due_offset_days, is_recurring, recurrence_interval, recurrence_interval_count, task_template_fields(id, task_template_id, key, label, field_type, sort_order, required, options, created_at, updated_at)),
  task_checklist_items(id, task_id, label, sort_order, completed, completed_at, created_at),
  client_services(client_id, clients(name), service:services(name))
`;

type TemplateShape = {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  default_due_offset_days: number | null;
  task_template_fields?: { id: string; key: string; label: string; field_type: string; sort_order: number; required: boolean; options: unknown }[];
};

type TaskRowFromDb = Task & {
  task_template?: unknown;
  task_templates?: unknown;
  task_checklist_items: TaskChecklistItem[];
  client_services?: { client_id: string; client?: { name: string }; clients?: { name: string }; service?: { name: string } } | { client_id: string; client?: { name: string }; clients?: { name: string }; service?: { name: string } }[];
};

function mapTaskRowToWithContext(t: TaskRowFromDb): TaskWithClientContext {
  const raw = t.task_template ?? (t as { task_templates?: unknown }).task_templates;
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
  const cs = Array.isArray(t.client_services) ? t.client_services[0] : t.client_services;
  const client_id = cs?.client_id;
  const nested = cs as { client?: { name: string }; clients?: { name: string }; service?: { name: string } } | undefined;
  const client_name = nested?.client?.name ?? nested?.clients?.name ?? undefined;
  const service_name = nested?.service?.name ?? undefined;
  return {
    ...t,
    task_template: safeTemplate,
    task_checklist_items: (t.task_checklist_items ?? []).sort(
      (a, b) => a.sort_order - b.sort_order
    ),
    client_id,
    client_name,
    service_name,
  } as TaskWithClientContext;
}

export async function getTasksForCurrentUser(
  options: GetTasksForCurrentUserOptions = {},
  currentUserId?: string | null
): Promise<GetTasksForCurrentUserResult> {
  const supabase = await createClient();
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, options.pageSize ?? 25));

  let clientServiceIds: string[] | null = null;
  if (options.client_id || options.service_id) {
    let q = supabase.from("client_services").select("id");
    if (options.client_id) q = q.eq("client_id", options.client_id);
    if (options.service_id) q = q.eq("service_id", options.service_id);
    const { data: rows } = await q;
    clientServiceIds = (rows ?? []).map((r: { id: string }) => r.id);
    if (clientServiceIds.length === 0) {
      return { tasks: [], totalCount: 0, page, pageSize };
    }
  }

  const todayIso = new Date().toISOString().slice(0, 10);

  let dataQuery = supabase
    .from("tasks")
    .select(TASKS_SELECT_WITH_CONTEXT, { count: "exact" });

  if (clientServiceIds) {
    dataQuery = dataQuery.in("client_service_id", clientServiceIds);
  }
  if (options.assignee) {
    const assigneeId = options.assignee === "me" ? currentUserId : options.assignee;
    if (assigneeId) dataQuery = dataQuery.eq("assignee_id", assigneeId);
  }
  if (options.status) {
    if (options.status === "overdue") {
      dataQuery = dataQuery.lt("due_date", todayIso).not("status", "in", '("completed","cancelled")');
    } else {
      dataQuery = dataQuery.eq("status", options.status);
    }
  }
  if (options.due_from) {
    dataQuery = dataQuery.gte("due_date", options.due_from);
  }
  if (options.due_to) {
    dataQuery = dataQuery.lte("due_date", options.due_to);
  }

  dataQuery = dataQuery.order("due_date", { ascending: true, nullsFirst: false });
  const from = (page - 1) * pageSize;
  dataQuery = dataQuery.range(from, from + pageSize - 1);

  const { data, error, count } = await dataQuery;
  if (error) throw error;

  const list = (data ?? []) as unknown as TaskRowFromDb[];

  const tasks = list.map(mapTaskRowToWithContext);
  const totalCount = count ?? 0;

  return { tasks, totalCount, page, pageSize };
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
      task_template:task_templates(id, service_id, name, description, sort_order, default_due_offset_days, is_recurring, recurrence_interval, recurrence_interval_count, task_template_fields(id, task_template_id, key, label, field_type, sort_order, required, options, created_at, updated_at)),
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

/** Create the next occurrence of a recurring task (same client_service, template, assignee). */
export async function createNextOccurrence(
  taskId: string
): Promise<{ taskId: string } | { error: string }> {
  const supabase = await createClient();
  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select(
      "id, client_service_id, task_template_id, assignee_id, status, completed_at, due_date"
    )
    .eq("id", taskId)
    .single();
  if (taskError || !task) return { error: "Task not found" };
  const taskRow = task as { status: string };
  if (taskRow.status !== "completed") return { error: "Task must be completed first" };

  const { data: template, error: templateError } = await supabase
    .from("task_templates")
    .select(
      "id, name, is_recurring, recurrence_interval, recurrence_interval_count, task_template_checklist(id, label, sort_order)"
    )
    .eq("id", task.task_template_id)
    .single();
  if (templateError || !template) return { error: "Template not found" };

  const t = template as {
    is_recurring: boolean;
    recurrence_interval: TaskRecurrenceInterval | null;
    recurrence_interval_count: number;
    name: string;
    task_template_checklist?: { label: string; sort_order: number }[];
  };
  if (!t.is_recurring || !t.recurrence_interval)
    return { error: "Template is not recurring" };

  const refDate = task.completed_at
    ? new Date(task.completed_at)
    : task.due_date
      ? new Date(task.due_date)
      : new Date();
  const nextDue = nextDueDateFromRecurrence(
    refDate,
    t.recurrence_interval,
    t.recurrence_interval_count
  );

  const { data: newTask, error: insertError } = await supabase
    .from("tasks")
    .insert({
      client_service_id: task.client_service_id,
      task_template_id: task.task_template_id,
      assignee_id: task.assignee_id,
      title: t.name,
      due_date: nextDue,
      status: "scheduled",
    })
    .select("id")
    .single();
  if (insertError || !newTask) return { error: insertError?.message ?? "Failed to create task" };

  const checklist = t.task_template_checklist ?? [];
  if (checklist.length > 0) {
    await supabase.from("task_checklist_items").insert(
      checklist.map((c) => ({
        task_id: newTask.id,
        label: c.label,
        sort_order: c.sort_order,
      }))
    );
  }
  return { taskId: newTask.id };
}
