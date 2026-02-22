/** All permission strings used in the app (for role management UI and API validation). Safe to import from client components. */
export const ALL_PERMISSIONS = [
  "users.manage",
  "users.read",
  "clients.create",
  "clients.read",
  "clients.update",
  "clients.delete",
  "clients.assign_ops",
  "clients.change_status_to_closed",
  "client_services.read",
  "client_services.update_stage",
  "client_services.assign",
  "services.create",
  "services.update",
  "services.delete",
  "task_templates.create",
  "task_templates.read",
  "task_templates.update",
  "task_templates.delete",
  "content.read",
  "content.create",
  "content.update",
  "reports.read",
] as const;

export type Permission = (typeof ALL_PERMISSIONS)[number];
