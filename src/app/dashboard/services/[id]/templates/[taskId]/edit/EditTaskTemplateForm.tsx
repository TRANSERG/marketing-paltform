"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import type { TaskTemplate } from "@/types/database";

export function EditTaskTemplateForm({
  template,
  action,
}: {
  template: TaskTemplate;
  action: (formData: FormData) => Promise<{ error?: string } | void>;
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    async (_: { error?: string } | undefined, formData: FormData) => {
      const result = await action(formData);
      if (result && "error" in result) return result;
      router.refresh();
      return undefined;
    },
    undefined as { error?: string } | undefined
  );

  return (
    <form
      action={formAction}
      className="max-w-md space-y-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4"
    >
      <div>
        <label htmlFor="name" className="mb-1 block text-xs text-zinc-500">
          Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          defaultValue={template.name}
          className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div>
        <label htmlFor="description" className="mb-1 block text-xs text-zinc-500">
          Description (optional)
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
          defaultValue={template.description ?? ""}
          className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div>
        <label htmlFor="sort_order" className="mb-1 block text-xs text-zinc-500">
          Sort order
        </label>
        <input
          type="number"
          id="sort_order"
          name="sort_order"
          min={0}
          defaultValue={template.sort_order}
          className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div>
        <label htmlFor="default_due_offset_days" className="mb-1 block text-xs text-zinc-500">
          Due date offset (days after assignment)
        </label>
        <input
          type="number"
          id="default_due_offset_days"
          name="default_due_offset_days"
          min={0}
          defaultValue={template.default_due_offset_days ?? ""}
          placeholder="e.g. 7"
          className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="is_recurring"
          name="is_recurring"
          defaultChecked={template.is_recurring}
          className="rounded border-zinc-600 bg-zinc-900 text-blue-500 focus:ring-blue-500"
        />
        <label htmlFor="is_recurring" className="text-sm text-zinc-400">
          Recurring task (e.g. daily posting, weekly review)
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="recurrence_interval" className="mb-1 block text-xs text-zinc-500">
            Repeat every
          </label>
          <select
            id="recurrence_interval"
            name="recurrence_interval"
            className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            defaultValue={template.recurrence_interval ?? "day"}
          >
            <option value="day">Day(s)</option>
            <option value="week">Week(s)</option>
            <option value="month">Month(s)</option>
          </select>
        </div>
        <div>
          <label htmlFor="recurrence_interval_count" className="mb-1 block text-xs text-zinc-500">
            Every N
          </label>
          <input
            type="number"
            id="recurrence_interval_count"
            name="recurrence_interval_count"
            min={1}
            defaultValue={template.recurrence_interval_count}
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
        className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
