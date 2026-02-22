import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { getServiceById } from "@/lib/services";
import { hasPermission } from "@/types/auth";
import { EditServiceForm } from "../../EditServiceForm";
import { TaskTemplatesSection } from "../../TaskTemplatesSection";

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getAuthUser();
  if (
    !hasPermission(user, "services.update") &&
    !hasPermission(user, "users.manage")
  ) {
    redirect("/dashboard/services");
  }
  const service = await getServiceById(id);
  if (!service) notFound();
  const canManageTemplates =
    hasPermission(user, "task_templates.create") ||
    hasPermission(user, "task_templates.update") ||
    hasPermission(user, "task_templates.delete") ||
    hasPermission(user, "users.manage");

  async function updateServiceAction(formData: FormData) {
    "use server";
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) return { error: "Not authenticated" };
    const name = (formData.get("name") as string)?.trim();
    const description = (formData.get("description") as string)?.trim() || null;
    if (!name) return { error: "Name is required" };
    const { error } = await supabase
      .from("services")
      .update({ name, description })
      .eq("id", id);
    if (error) return { error: error.message };
  }

  async function createTaskTemplateAction(formData: FormData) {
    "use server";
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) return { error: "Not authenticated" };
    const name = (formData.get("name") as string)?.trim();
    const sort_order = parseInt(
      (formData.get("sort_order") as string) ?? "0",
      10
    );
    const default_due_offset_daysRaw = formData.get(
      "default_due_offset_days"
    ) as string;
    const default_due_offset_days =
      default_due_offset_daysRaw === "" || default_due_offset_daysRaw === null
        ? null
        : parseInt(default_due_offset_daysRaw, 10);
    const is_recurring = formData.get("is_recurring") === "on";
    const recurrence_intervalRaw = (formData.get("recurrence_interval") as string) || null;
    const recurrence_interval =
      recurrence_intervalRaw && ["day", "week", "month"].includes(recurrence_intervalRaw)
        ? recurrence_intervalRaw
        : null;
    const recurrence_interval_count = Math.max(
      1,
      parseInt((formData.get("recurrence_interval_count") as string) ?? "1", 10) || 1
    );
    if (!name) return { error: "Name is required" };
    const { error } = await supabase.from("task_templates").insert({
      service_id: id,
      name,
      sort_order: Number.isNaN(sort_order) ? 0 : sort_order,
      default_due_offset_days: default_due_offset_days != null && !Number.isNaN(default_due_offset_days) ? default_due_offset_days : null,
      is_recurring: !!is_recurring,
      recurrence_interval: is_recurring ? recurrence_interval : null,
      recurrence_interval_count,
    });
    if (error) return { error: error.message };
  }

  return (
    <div className="space-y-8">
      <Link
        href={`/dashboard/services/${id}`}
        className="text-sm text-zinc-400 hover:text-white min-h-[44px] inline-flex items-center"
      >
        ← Back to service
      </Link>
      <h2 className="text-lg font-medium">Edit service: {service.name}</h2>

      <EditServiceForm
        serviceId={id}
        initialName={service.name}
        initialDescription={service.description ?? ""}
        action={updateServiceAction}
      />

      {canManageTemplates && (
        <TaskTemplatesSection
          serviceId={id}
          taskTemplates={service.task_templates}
          createAction={createTaskTemplateAction}
        />
      )}
    </div>
  );
}
