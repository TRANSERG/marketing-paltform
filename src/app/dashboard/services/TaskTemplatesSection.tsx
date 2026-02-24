"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Spinner } from "@/components/Spinner";
import type { TaskTemplate } from "@/types/database";

interface TaskTemplatesSectionProps {
  serviceId: string;
  taskTemplates: (TaskTemplate & {
    task_template_checklist?: { id: string; label: string; sort_order: number }[];
    task_template_fields?: { id: string }[];
  })[];
  createAction: (formData: FormData) => Promise<{ error?: string } | void>;
}

export function TaskTemplatesSection({
  serviceId,
  taskTemplates,
  createAction,
}: TaskTemplatesSectionProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    async (_: { error?: string } | undefined, formData: FormData) => {
      const result = await createAction(formData);
      if (result && "error" in result) return result;
      return undefined;
    },
    undefined as { error?: string } | undefined
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(templateId: string) {
    if (!confirm("Delete this task template? Existing tasks will keep their data."))
      return;
    setDeletingId(templateId);
    const res = await fetch(`/api/task-templates/${templateId}`, {
      method: "DELETE",
    });
    setDeletingId(null);
    if (res.ok) router.refresh();
    else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Failed to delete template");
    }
  }

  const maxOrder =
    taskTemplates.length > 0
      ? Math.max(...taskTemplates.map((t) => t.sort_order), 0)
      : 0;

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Task templates</h3>
      <p className="text-sm text-zinc-400">
        Each template becomes one task when a client is assigned this service. Order and due offset (days after assignment) control the sequence.
      </p>

      <form action={formAction} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-3 max-w-md">
        <h4 className="text-sm font-medium text-zinc-300">Add task template</h4>
        <div>
          <label htmlFor="template_name" className="mb-1 block text-xs text-zinc-500">
            Name
          </label>
          <input
            type="text"
            id="template_name"
            name="name"
            required
            className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="e.g. Brief"
          />
        </div>
        <div>
          <label htmlFor="template_sort_order" className="mb-1 block text-xs text-zinc-500">
            Sort order
          </label>
          <input
            type="number"
            id="template_sort_order"
            name="sort_order"
            min={0}
            defaultValue={maxOrder + 1}
            className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="template_due_offset" className="mb-1 block text-xs text-zinc-500">
            Due date offset (days after assignment)
          </label>
          <input
            type="number"
            id="template_due_offset"
            name="default_due_offset_days"
            min={0}
            className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="e.g. 7"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="template_is_recurring"
            name="is_recurring"
            className="rounded border-zinc-600 bg-zinc-900 text-blue-500 focus:ring-blue-500"
          />
          <label htmlFor="template_is_recurring" className="text-sm text-zinc-400">
            Recurring task (e.g. daily posting, weekly review)
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="template_recurrence_interval" className="mb-1 block text-xs text-zinc-500">
              Repeat every
            </label>
            <select
              id="template_recurrence_interval"
              name="recurrence_interval"
              className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="day">Day(s)</option>
              <option value="week">Week(s)</option>
              <option value="month">Month(s)</option>
            </select>
          </div>
          <div>
            <label htmlFor="template_recurrence_count" className="mb-1 block text-xs text-zinc-500">
              Every N
            </label>
            <input
              type="number"
              id="template_recurrence_count"
              name="recurrence_interval_count"
              min={1}
              defaultValue={1}
              className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
        {state?.error && (
          <p className="text-sm text-red-400">{state.error}</p>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-2"
        >
          {isPending ? (
            <>
              <Spinner size="sm" className="shrink-0" />
              Adding…
            </>
          ) : (
            "Add template"
          )}
        </button>
      </form>

      {taskTemplates.length === 0 ? (
        <p className="text-sm text-zinc-500">No task templates yet.</p>
      ) : (
        <div className="rounded-lg border border-zinc-800 overflow-hidden overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[400px]">
            <thead className="bg-zinc-900 text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Due offset</th>
                <th className="px-4 py-3 font-medium">Recurring</th>
                <th className="px-4 py-3 font-medium">Form fields</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {taskTemplates.map((t, idx) => (
                <tr key={t.id}>
                  <td className="px-4 py-3 text-zinc-400">{t.sort_order}</td>
                  <td className="px-4 py-3 font-medium">{t.name}</td>
                  <td className="px-4 py-3 text-zinc-400">
                    {t.default_due_offset_days ?? "—"} days
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {t.is_recurring
                      ? `Every ${t.recurrence_interval_count} ${t.recurrence_interval ?? "day"}${(t.recurrence_interval_count ?? 1) > 1 ? "s" : ""}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/services/${serviceId}/templates/${t.id}/fields`}
                      className="rounded border border-zinc-600 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800"
                    >
                      Form fields ({(t as { task_template_fields?: unknown[] }).task_template_fields?.length ?? 0})
                    </Link>
                  </td>
                  <td className="px-4 py-3 flex flex-wrap gap-1">
                    <Link
                      href={`/dashboard/services/${serviceId}/templates/${t.id}/edit`}
                      className="rounded border border-zinc-600 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(t.id)}
                      disabled={deletingId === t.id}
                      className="rounded border border-red-800 px-2 py-1 text-xs text-red-400 hover:bg-red-900/30 disabled:opacity-50 inline-flex items-center gap-1.5"
                    >
                      {deletingId === t.id ? (
                        <>
                          <Spinner size="sm" className="h-3 w-3 shrink-0" />
                          Deleting…
                        </>
                      ) : (
                        "Delete"
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
