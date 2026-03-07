// Align with Supabase schema (clients, services, client_services, service_stages, client_service_stages, task_templates, task_template_fields, tasks, task_checklist_items)

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
  website: string | null;
  business_category: string | null;
  tagline: string | null;
  created_by: string | null;
  assigned_ops_id: string | null;
  sold_at: string | null;
  activated_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Client Profile ──────────────────────────────────────────────────────────

export type TeamSize = "solo" | "2-5" | "6-20" | "20+";
export type PriceRange = "$" | "$$" | "$$$" | "$$$$";

export interface WorkingHoursDay {
  day: "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
  open: string;   // "09:00"
  close: string;  // "18:00"
  closed: boolean;
}

export interface SpecialHoursDay {
  date: string;   // "2025-12-25"
  label: string;  // "Christmas"
  open?: string;
  close?: string;
  closed: boolean;
}

export interface ClientProfile {
  id: string;
  client_id: string;

  // About
  description: string | null;
  founded_year: number | null;
  team_size: TeamSize | null;
  price_range: PriceRange | null;
  target_audience: string | null;

  // Structured address
  street_address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;

  // Social & online
  instagram_handle: string | null;
  facebook_handle: string | null;
  tiktok_handle: string | null;
  youtube_handle: string | null;
  google_business_url: string | null;
  booking_link: string | null;
  order_link: string | null;

  // Operational
  delivery_platforms: string[] | null;
  payment_methods: string[] | null;
  working_hours: WorkingHoursDay[] | null;
  special_hours: SpecialHoursDay[] | null;
  amenities: string[] | null;
  languages_spoken: string[] | null;

  // Marketing
  unique_selling_points: string[] | null;

  created_at: string;
  updated_at: string;
}

export type ClientProfileUpsert = Omit<ClientProfile, "id" | "created_at" | "updated_at"> & {
  id?: string;
};

// ─── Client Brand ────────────────────────────────────────────────────────────

export type BrandTone =
  | "professional"
  | "friendly"
  | "playful"
  | "bold"
  | "luxurious"
  | "earthy"
  | "minimalist"
  | "edgy";

export interface ClientBrand {
  id: string;
  client_id: string;

  logo_path: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  background_color: string | null;
  heading_font: string | null;
  body_font: string | null;
  brand_tone: BrandTone | null;
  style_notes: string | null;
  content_themes: string[] | null;
  hashtags: string[] | null;

  created_at: string;
  updated_at: string;
}

export type ClientBrandUpsert = Omit<ClientBrand, "id" | "created_at" | "updated_at"> & {
  id?: string;
};

// ─── Client Offerings ────────────────────────────────────────────────────────

export type OfferingType =
  | "menu_item"
  | "service"
  | "class"
  | "product"
  | "membership"
  | "package";

export interface ClientOffering {
  id: string;
  client_id: string;
  offering_type: OfferingType;
  category: string | null;
  name: string;
  description: string | null;
  price: number | null;
  currency: string;
  duration_minutes: number | null;
  is_available: boolean;
  is_featured: boolean;
  tags: string[] | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type ClientOfferingInsert = Omit<ClientOffering, "id" | "created_at" | "updated_at"> & {
  id?: string;
};

// ─── Client Team Members ─────────────────────────────────────────────────────

export interface ClientTeamMember {
  id: string;
  client_id: string;
  name: string;
  role: string | null;
  bio: string | null;
  photo_path: string | null;
  specialties: string[] | null;
  instagram_handle: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type ClientTeamMemberInsert = Omit<ClientTeamMember, "id" | "created_at" | "updated_at"> & {
  id?: string;
};

// ─── Client Assets ───────────────────────────────────────────────────────────

export type AssetType =
  | "photo"
  | "video"
  | "menu_design"
  | "logo"
  | "graphic"
  | "document"
  | "other";

export type AssetCategory =
  | "food"
  | "drinks"
  | "interior"
  | "exterior"
  | "team"
  | "product"
  | "event"
  | "before_after"
  | "packaging"
  | "other";

export interface ClientAsset {
  id: string;
  client_id: string;
  created_by: string | null;
  asset_type: AssetType;
  category: AssetCategory | null;
  file_path: string;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  alt_text: string | null;
  tags: string[] | null;
  is_featured: boolean;
  created_at: string;
}

export type ClientAssetInsert = Omit<ClientAsset, "id" | "created_at"> & {
  id?: string;
};

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

export type TaskTemplateFieldType =
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "url"
  | "file"
  | "file_multiple";

export interface TaskTemplateField {
  id: string;
  task_template_id: string;
  key: string;
  label: string;
  field_type: TaskTemplateFieldType;
  sort_order: number;
  required: boolean;
  options: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export type TaskRecurrenceInterval = "day" | "week" | "month";

export interface TaskTemplate {
  id: string;
  service_id: string;
  name: string;
  description: string | null;
  sort_order: number;
  default_due_offset_days: number | null;
  is_recurring: boolean;
  recurrence_interval: TaskRecurrenceInterval | null;
  recurrence_interval_count: number;
  created_at: string;
  updated_at: string;
  task_template_fields?: TaskTemplateField[];
}

export interface TaskTemplateChecklistItem {
  id: string;
  task_template_id: string;
  label: string;
  sort_order: number;
  created_at: string;
}

/** Structured output keyed by field key; file fields = array of storage paths/URLs */
export type TaskOutputData = Record<string, string | number | string[] | null>;

export interface Task {
  id: string;
  client_service_id: string;
  task_template_id: string;
  assignee_id: string | null;
  assigned_by_id: string | null;
  title: string | null;
  description: string | null;
  due_date: string | null;
  scheduled_at: string | null;
  status: TaskStatus;
  output: string | null;
  output_data: TaskOutputData | null;
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

/** Task with optional template, checklist, and viewer ids (from getTaskById etc.) */
export interface TaskWithDetails extends Task {
  task_template?: TaskTemplate;
  task_checklist_items?: TaskChecklistItem[];
  /** User ids who can view this task (from task_viewers). */
  viewer_ids?: string[];
}

/** Task with client/service context for all-tasks view */
export interface TaskWithClientContext extends TaskWithDetails {
  client_id?: string;
  client_name?: string;
  service_name?: string;
}

/** Options for getTasksForCurrentUser (filters + pagination) */
export interface GetTasksForCurrentUserOptions {
  status?: TaskStatus | "overdue";
  assignee?: "me" | string;
  client_id?: string;
  service_id?: string;
  due_from?: string;
  due_to?: string;
  page?: number;
  pageSize?: number;
}

export interface GetTasksForCurrentUserResult {
  tasks: TaskWithClientContext[];
  totalCount: number;
  page: number;
  pageSize: number;
}

// ─── Content Calendar ───────────────────────────────────────────────────────

export type PostPlatform =
  | "instagram"
  | "facebook"
  | "linkedin"
  | "twitter"
  | "tiktok";

export type PostStatus = "draft" | "scheduled" | "published";

export interface ContentPost {
  id: string;
  client_id: string;
  created_by: string | null;
  platform: PostPlatform;
  caption: string;
  scheduled_at: string; // ISO timestamptz
  status: PostStatus;
  media_path: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type ContentPostInsert = Omit<
  ContentPost,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};
