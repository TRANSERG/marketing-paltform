import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { getServiceById } from "@/lib/services";
import { hasPermission } from "@/types/auth";
import type { TaskRecurrenceInterval } from "@/types/database";
import { EditTaskTemplateForm } from "./EditTaskTemplateForm";

export default async function EditTaskTemplatePage({
  params,
}: {
  params: Promise<{ id: string; taskId: string }>;
}) {
  const { id: serviceId, taskId: templateId } = await params;
  const user = await getAuthUser();
  if (
    !hasPermission(user, "task_templates.update") &&
    !hasPermission(user, "users.manage")
  ) {
    redirect("/dashboard/services");
  }
  const service = await getServiceById(serviceId);
  if (!service) notFound();
  const template = service.task_templates.find((t) => t.id === templateId);
  if (!template) notFound();

  async function updateTemplateAction(formData: FormData) {
    "use server";
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) return { error: "Not authenticated" };
    const name = (formData.get("name") as string)?.trim();
    const description = (formData.get("description") as string)?.trim() || null;
    const sort_order = parseInt((formData.get("sort_order") as string) ?? "0", 10);
    const default_due_offset_daysRaw = formData.get("default_due_offset_days") as string;
    const default_due_offset_days =
      default_due_offset_daysRaw === "" || default_due_offset_daysRaw === null
        ? null
        : parseInt(default_due_offset_daysRaw, 10);
    const is_recurring = formData.get("is_recurring") === "on";
    const recurrence_intervalRaw = (formData.get("recurrence_interval") as string) || null;
    const recurrence_interval: TaskRecurrenceInterval | null =
      recurrence_intervalRaw && ["day", "week", "month"].includes(recurrence_intervalRaw)
        ? (recurrence_intervalRaw as TaskRecurrenceInterval)
        : null;
    const recurrence_interval_count = Math.max(
      1,
      parseInt((formData.get("recurrence_interval_count") as string) ?? "1", 10) || 1
    );
    if (!name) return { error: "Name is required" };
    const { error } = await supabase
      .from("task_templates")
      .update({
        name,
        description,
        sort_order: Number.isNaN(sort_order) ? 0 : sort_order,
        default_due_offset_days:
          default_due_offset_days != null && !Number.isNaN(default_due_offset_days)
            ? default_due_offset_days
            : null,
        is_recurring: !!is_recurring,
        recurrence_interval: is_recurring ? recurrence_interval : null,
        recurrence_interval_count,
        updated_at: new Date().toISOString(),
      })
      .eq("id", templateId);
    if (error) return { error: error.message };
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={`/dashboard/services/${serviceId}/edit`}
          className="text-sm text-zinc-400 hover:text-white min-h-[44px] inline-flex items-center"
        >
          ← Back to service
        </Link>
        <Link
          href={`/dashboard/services/${serviceId}/templates/${templateId}/fields`}
          className="text-sm text-zinc-400 hover:text-white"
        >
          Form fields →
        </Link>
      </div>
      <h2 className="text-lg font-medium">Edit template: {template.name}</h2>

      <EditTaskTemplateForm
        template={template}
        action={updateTemplateAction}
      />
    </div>
  );
}
