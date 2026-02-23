import Link from "next/link";
import { getAuthUser } from "@/lib/auth";
import { getClients } from "@/lib/clients";
import { getServicesForFilter } from "@/lib/services";
import { getTasksForCurrentUser } from "@/lib/tasks";
import { hasPermission } from "@/types/auth";
import type { GetTasksForCurrentUserOptions, TaskStatus } from "@/types/database";
import { TasksFilterForm } from "./TasksFilterForm";
import { TasksPagination } from "./TasksPagination";

const PAGE_SIZES = [10, 25, 50] as const;
const DEFAULT_PAGE_SIZE = 25;

function parsePage(s: string | undefined): number {
  const n = parseInt(s ?? "1", 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

function parsePageSize(s: string | undefined): number {
  const n = parseInt(s ?? String(DEFAULT_PAGE_SIZE), 10);
  return PAGE_SIZES.includes(n as (typeof PAGE_SIZES)[number]) ? n : DEFAULT_PAGE_SIZE;
}

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : undefined;
  const assignee = typeof params.assignee === "string" ? params.assignee : undefined;
  const client_id = typeof params.client_id === "string" ? params.client_id : undefined;
  const service_id = typeof params.service_id === "string" ? params.service_id : undefined;
  const due_from = typeof params.due_from === "string" ? params.due_from : undefined;
  const due_to = typeof params.due_to === "string" ? params.due_to : undefined;
  const page = parsePage(typeof params.page === "string" ? params.page : undefined);
  const pageSize = parsePageSize(typeof params.pageSize === "string" ? params.pageSize : undefined);

  const user = await getAuthUser();
  const validStatuses: (TaskStatus | "overdue")[] = ["draft", "scheduled", "ongoing", "overdue", "completed", "cancelled"];
  const options: GetTasksForCurrentUserOptions = {
    status: status && validStatuses.includes(status as TaskStatus | "overdue") ? (status as TaskStatus | "overdue") : undefined,
    assignee: assignee || undefined,
    client_id: client_id || undefined,
    service_id: service_id || undefined,
    due_from: due_from || undefined,
    due_to: due_to || undefined,
    page,
    pageSize,
  };

  const [result, clients, services] = await Promise.all([
    getTasksForCurrentUser(options, user?.id ?? null),
    getClients(undefined, { limit: 500 }),
    getServicesForFilter(),
  ]);

  const canUpdateTask =
    hasPermission(user, "client_services.update_stage") ||
    hasPermission(user, "users.manage") ||
    hasPermission(user, "clients.update");

  return (
    <div className="space-y-6 sm:space-y-8">
      <h1 className="text-lg font-medium">Tasks</h1>

      <TasksFilterForm
        current={{ status, assignee, client_id, service_id, due_from, due_to, pageSize }}
        clients={clients}
        services={services}
      />

      <div className="rounded-lg border border-zinc-800 overflow-hidden overflow-x-auto">
        {result.tasks.length === 0 ? (
          <p className="px-4 py-8 text-center text-zinc-500">
            No tasks match your filters.
          </p>
        ) : (
          <table className="w-full text-left text-sm min-w-[500px]">
            <thead className="bg-zinc-900 text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Service</th>
                <th className="px-4 py-3 font-medium">Task</th>
                <th className="px-4 py-3 font-medium">Due date</th>
                <th className="px-4 py-3 font-medium">Status</th>
                {canUpdateTask && <th className="px-4 py-3 font-medium">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {result.tasks.map((task) => {
                const displayStatus =
                  task.status === "overdue" ||
                  (task.due_date &&
                    task.status !== "completed" &&
                    task.status !== "cancelled" &&
                    new Date(task.due_date) < new Date())
                    ? "overdue"
                    : task.status;
                const clientId = task.client_id ?? "";
                return (
                  <tr key={task.id}>
                    <td className="px-4 py-3">
                      {clientId ? (
                        <Link
                          href={`/dashboard/clients/${clientId}`}
                          className="text-blue-400 hover:underline"
                        >
                          {task.client_name ?? "—"}
                        </Link>
                      ) : (
                        task.client_name ?? "—"
                      )}
                    </td>
                    <td className="px-4 py-3">{task.service_name ?? "—"}</td>
                    <td className="px-4 py-3">{task.title ?? task.task_template?.name ?? "—"}</td>
                    <td className="px-4 py-3">
                      {task.due_date ? new Date(task.due_date).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3 capitalize">{displayStatus}</td>
                    {canUpdateTask && clientId && (
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/clients/${clientId}/tasks/${task.id}`}
                          className="text-blue-400 hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {result.totalCount > 0 && (
        <TasksPagination
          page={result.page}
          pageSize={result.pageSize}
          totalCount={result.totalCount}
          currentParams={params}
        />
      )}
    </div>
  );
}
