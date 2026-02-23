"use client";

import Link from "next/link";
import type { Client } from "@/types/database";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "ongoing", label: "Ongoing" },
  { value: "overdue", label: "Overdue" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

interface TasksFilterFormProps {
  current: {
    status?: string;
    assignee?: string;
    client_id?: string;
    service_id?: string;
    due_from?: string;
    due_to?: string;
    pageSize?: number;
  };
  clients: Client[];
  services: { id: string; name: string }[];
}

export function TasksFilterForm({ current, clients, services }: TasksFilterFormProps) {
  return (
    <form
      method="get"
      action="/dashboard/tasks"
      className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 flex flex-wrap items-end gap-4"
    >
      <input type="hidden" name="page" value="1" />
      {current.pageSize != null && (
        <input type="hidden" name="pageSize" value={String(current.pageSize)} />
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="tasks-filter-status" className="text-xs text-zinc-500">
          Status
        </label>
        <select
          id="tasks-filter-status"
          name="status"
          defaultValue={current.status ?? ""}
          className="rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-white min-w-[140px]"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value || "all"} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="tasks-filter-assignee" className="text-xs text-zinc-500">
          Assignee
        </label>
        <select
          id="tasks-filter-assignee"
          name="assignee"
          defaultValue={current.assignee ?? ""}
          className="rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-white min-w-[160px]"
        >
          <option value="">All</option>
          <option value="me">Assigned to me</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="tasks-filter-client" className="text-xs text-zinc-500">
          Client
        </label>
        <select
          id="tasks-filter-client"
          name="client_id"
          defaultValue={current.client_id ?? ""}
          className="rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-white min-w-[180px]"
        >
          <option value="">All clients</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="tasks-filter-service" className="text-xs text-zinc-500">
          Service
        </label>
        <select
          id="tasks-filter-service"
          name="service_id"
          defaultValue={current.service_id ?? ""}
          className="rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-white min-w-[160px]"
        >
          <option value="">All services</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="tasks-filter-due-from" className="text-xs text-zinc-500">
          Due from
        </label>
        <input
          id="tasks-filter-due-from"
          type="date"
          name="due_from"
          defaultValue={current.due_from ?? ""}
          className="rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-white"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="tasks-filter-due-to" className="text-xs text-zinc-500">
          Due to
        </label>
        <input
          id="tasks-filter-due-to"
          type="date"
          name="due_to"
          defaultValue={current.due_to ?? ""}
          className="rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-white"
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 min-h-[40px]"
        >
          Apply
        </button>
        <Link
          href="/dashboard/tasks"
          className="rounded-lg border border-zinc-600 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 min-h-[40px] inline-flex items-center"
        >
          Clear
        </Link>
      </div>
    </form>
  );
}
