import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { getServiceById } from "@/lib/services";
import { hasPermission } from "@/types/auth";
import type { TaskTemplateFieldType } from "@/types/database";
import { TaskTemplateFieldsSection } from "./TaskTemplateFieldsSection";

const FIELD_TYPES: { value: TaskTemplateFieldType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Text area" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "url", label: "URL" },
  { value: "file", label: "File (single image/video)" },
  { value: "file_multiple", label: "Files (multiple images/videos)" },
];

export default async function TemplateFieldsPage({
  params,
}: {
  params: Promise<{ id: string; taskId: string }>;
}) {
  const { id: serviceId, taskId: templateId } = await params;
  const user = await getAuthUser();
  if (
    !hasPermission(user, "task_templates.update") &&
    !hasPermission(user, "task_templates.create") &&
    !hasPermission(user, "users.manage")
  ) {
    redirect("/dashboard/services");
  }
  const service = await getServiceById(serviceId);
  if (!service) notFound();
  const template = service.task_templates.find((t) => t.id === templateId);
  if (!template) notFound();
  const fields = template.task_template_fields ?? [];

  async function createFieldAction(formData: FormData) {
    "use server";
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) return { error: "Not authenticated" };
    const key = (formData.get("key") as string)?.trim().toLowerCase().replace(/\s+/g, "_");
    const label = (formData.get("label") as string)?.trim();
    const field_type = formData.get("field_type") as TaskTemplateFieldType;
    const sort_order = parseInt((formData.get("sort_order") as string) ?? "0", 10);
    const required = formData.get("required") === "on";
    if (!key || !label || !field_type) return { error: "Key, label, and type are required" };
    const validTypes: TaskTemplateFieldType[] = ["text", "textarea", "number", "date", "url", "file", "file_multiple"];
    if (!validTypes.includes(field_type)) return { error: "Invalid field type" };
    const options: Record<string, unknown> | null = null;
    const { error } = await supabase.from("task_template_fields").insert({
      task_template_id: templateId,
      key,
      label,
      field_type,
      sort_order: Number.isNaN(sort_order) ? 0 : sort_order,
      required,
      options,
    });
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
      </div>
      <h2 className="text-lg font-medium">
        Form fields: {template.name}
      </h2>
      <p className="text-sm text-zinc-400">
        Define the form the assignee will see when completing a task from this template. Add text, URL, date, or file upload fields.
      </p>

      <TaskTemplateFieldsSection
        serviceId={serviceId}
        templateId={templateId}
        fields={fields}
        fieldTypes={FIELD_TYPES}
        createAction={createFieldAction}
      />
    </div>
  );
}
