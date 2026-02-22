"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import type { TaskTemplateField } from "@/types/database";

interface TaskTemplateFieldsSectionProps {
  serviceId: string;
  templateId: string;
  fields: TaskTemplateField[];
  fieldTypes: { value: TaskTemplateField["field_type"]; label: string }[];
  createAction: (formData: FormData) => Promise<{ error?: string } | void>;
}

export function TaskTemplateFieldsSection({
  serviceId: _serviceId,
  templateId,
  fields,
  fieldTypes,
  createAction,
}: TaskTemplateFieldsSectionProps) {
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

  async function handleDelete(fieldId: string) {
    if (!confirm("Remove this form field? Existing task data for this field will remain but the field will no longer show for new tasks."))
      return;
    setDeletingId(fieldId);
    const res = await fetch(
      `/api/task-templates/${templateId}/fields/${fieldId}`,
      { method: "DELETE" }
    );
    setDeletingId(null);
    if (res.ok) router.refresh();
    else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Failed to delete field");
    }
  }

  const maxOrder =
    fields.length > 0 ? Math.max(...fields.map((f) => f.sort_order), 0) : 0;

  return (
    <div className="space-y-6">
      <form
        action={formAction}
        className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-3 max-w-md"
      >
        <h3 className="text-sm font-medium text-zinc-300">Add form field</h3>
        <div>
          <label htmlFor="field_key" className="mb-1 block text-xs text-zinc-500">
            Key (slug, e.g. notes or screenshots)
          </label>
          <input
            type="text"
            id="field_key"
            name="key"
            required
            className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="e.g. notes"
          />
        </div>
        <div>
          <label htmlFor="field_label" className="mb-1 block text-xs text-zinc-500">
            Label
          </label>
          <input
            type="text"
            id="field_label"
            name="label"
            required
            className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="e.g. Notes"
          />
        </div>
        <div>
          <label htmlFor="field_type" className="mb-1 block text-xs text-zinc-500">
            Type
          </label>
          <select
            id="field_type"
            name="field_type"
            required
            className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {fieldTypes.map((ft) => (
              <option key={ft.value} value={ft.value}>
                {ft.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="field_sort_order" className="mb-1 block text-xs text-zinc-500">
            Sort order
          </label>
          <input
            type="number"
            id="field_sort_order"
            name="sort_order"
            min={0}
            defaultValue={maxOrder + 1}
            className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="field_required"
            name="required"
            className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-blue-600"
          />
          <label htmlFor="field_required" className="text-sm text-zinc-400">
            Required
          </label>
        </div>
        {state?.error && (
          <p className="text-sm text-red-400">{state.error}</p>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? "Adding…" : "Add field"}
        </button>
      </form>

      {fields.length === 0 ? (
        <p className="text-sm text-zinc-500">No form fields yet. Add one above.</p>
      ) : (
        <div className="rounded-lg border border-zinc-800 overflow-hidden overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[500px]">
            <thead className="bg-zinc-900 text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Key</th>
                <th className="px-4 py-3 font-medium">Label</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Required</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {fields.map((f) => (
                <tr key={f.id}>
                  <td className="px-4 py-3 text-zinc-400">{f.sort_order}</td>
                  <td className="px-4 py-3 font-mono text-zinc-300">{f.key}</td>
                  <td className="px-4 py-3">{f.label}</td>
                  <td className="px-4 py-3 text-zinc-400">{f.field_type}</td>
                  <td className="px-4 py-3 text-zinc-400">
                    {f.required ? "Yes" : "No"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleDelete(f.id)}
                      disabled={deletingId === f.id}
                      className="rounded border border-red-800 px-2 py-1 text-xs text-red-400 hover:bg-red-900/30 disabled:opacity-50"
                    >
                      {deletingId === f.id ? "Deleting…" : "Delete"}
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
