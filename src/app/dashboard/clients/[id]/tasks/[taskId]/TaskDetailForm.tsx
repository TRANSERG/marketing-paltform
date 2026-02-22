"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { TaskStatus } from "@/types/database";

const TASK_STATUSES: TaskStatus[] = [
  "draft",
  "scheduled",
  "ongoing",
  "overdue",
  "completed",
  "cancelled",
];

interface TaskDetailFormProps {
  taskId: string;
  clientId: string;
  initialStatus: TaskStatus;
  initialDueDate?: string;
  initialOutput?: string;
}

export function TaskDetailForm({
  taskId,
  initialStatus,
  initialDueDate,
  initialOutput,
}: TaskDetailFormProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const status = formData.get("status") as TaskStatus;
    const due_date = (formData.get("due_date") as string) || null;
    const output = (formData.get("output") as string) || null;
    startTransition(async () => {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, due_date, output }),
      });
      if (res.ok) router.refresh();
      else {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Failed to update task");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div>
        <label htmlFor="status" className="block text-sm text-zinc-400">
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={initialStatus}
          disabled={isPending}
          className="mt-1 w-full max-w-xs rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
        >
          {TASK_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="due_date" className="block text-sm text-zinc-400">
          Due date
        </label>
        <input
          type="date"
          id="due_date"
          name="due_date"
          defaultValue={initialDueDate ?? ""}
          disabled={isPending}
          className="mt-1 w-full max-w-xs rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
        />
      </div>
      <div>
        <label htmlFor="output" className="block text-sm text-zinc-400">
          Output
        </label>
        <textarea
          id="output"
          name="output"
          rows={6}
          defaultValue={initialOutput ?? ""}
          disabled={isPending}
          placeholder="Share notes, links, or deliverables..."
          className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
