// Align with Supabase schema (clients, services, client_services, service_stages, client_service_stages, task_templates, tasks, task_checklist_items)

export type ClientStatus =
  | "lead"
  | "qualified"
  | "closed"
  | "active"
  | "churned";

export type ServiceStatus =
  | "pending"
  | "onboarding"
  | "active"
  | "paused"
  | "completed";

export type TaskStatus =
  | "draft"
  | "scheduled"
  | "ongoing"
  | "overdue"
  | "completed"
  | "cancelled";

export interface Client {
  id: string;
  name: string;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  timezone: string | null;
  status: ClientStatus;
  created_by: string | null;
  assigned_ops_id: string | null;
  sold_at: string | null;
  activated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface ServiceStage {
  id: string;
  service_id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface ClientService {
  id: string;
  client_id: string;
  service_id: string;
  status: ServiceStatus;
  created_at: string;
  updated_at: string;
  service?: Service;
  current_stage?: ServiceStage;
}

export interface ClientServiceStage {
  id: string;
  client_service_id: string;
  service_stage_id: string;
  entered_at: string;
  notes: string | null;
  service_stage?: ServiceStage;
}

export interface TaskTemplate {
  id: string;
  service_id: string;
  name: string;
  description: string | null;
  sort_order: number;
  default_due_offset_days: number | null;
  created_at: string;
  updated_at: string;
}

export interface TaskTemplateChecklistItem {
  id: string;
  task_template_id: string;
  label: string;
  sort_order: number;
  created_at: string;
}

export interface Task {
  id: string;
  client_service_id: string;
  task_template_id: string;
  assignee_id: string | null;
  title: string | null;
  due_date: string | null;
  scheduled_at: string | null;
  status: TaskStatus;
  output: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskChecklistItem {
  id: string;
  task_id: string;
  label: string;
  sort_order: number;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
}

/** Client service with service name and current stage (from getClientById) */
export interface ClientServiceWithDetails {
  id: string;
  client_id: string;
  service_id: string;
  status: ServiceStatus;
  created_at: string;
  updated_at: string;
  service: { id: string; name: string; description: string | null };
  current_stage?: { id: string; name: string; sort_order: number };
}

export type ClientInsert = Omit<Client, "id" | "created_at" | "updated_at"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type ClientServiceInsert = Omit<
  ClientService,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

/** Task with optional template and checklist (from getTasksByClientServiceId etc.) */
export interface TaskWithDetails extends Task {
  task_template?: TaskTemplate;
  task_checklist_items?: TaskChecklistItem[];
}
