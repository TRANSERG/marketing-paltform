import Link from "next/link";
import { notFound } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { getClientById } from "@/lib/clients";
import { getTaskById } from "@/lib/tasks";
import { getProfileDisplayName } from "@/lib/users";
import { hasPermission } from "@/types/auth";
import { TaskDetailForm } from "./TaskDetailForm";
import { TaskChecklist } from "./TaskChecklist";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string; taskId: string }>;
}) {
  const { id: clientId, taskId } = await params;
  const [user, { client, clientServices }, task] = await Promise.all([
    getAuthUser(),
    getClientById(clientId),
    getTaskById(taskId),
  ]);
  if (!client || !task) notFound();
  const belongsToClient = clientServices.some(
    (cs) => cs.id === task.client_service_id
  );
  if (!belongsToClient) notFound();
  const canUpdate =
    hasPermission(user, "client_services.update_stage") ||
    hasPermission(user, "users.manage") ||
    hasPermission(user, "clients.update");
  const isAssignee = task.assignee_id === user?.id;
  const canEdit = canUpdate || isAssignee;
  const assigneeName = task.assignee_id
    ? await getProfileDisplayName(task.assignee_id)
    : null;

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={`/dashboard/clients/${clientId}`}
          className="text-sm text-zinc-400 hover:text-white min-h-[44px] flex items-center"
        >
          ← Back to client
        </Link>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 sm:p-6">
        <h2 className="text-lg font-medium">
          {task.title ?? task.task_template?.name ?? "Task"}
        </h2>
        <dl className="mt-4 grid gap-2 text-sm">
          <div>
            <dt className="text-zinc-500">Client</dt>
            <dd>{client.name}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Due date</dt>
            <dd>
              {task.due_date
                ? new Date(task.due_date).toLocaleDateString()
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Status</dt>
            <dd className="capitalize">{task.status}</dd>
          </div>
          {assigneeName !== null && (
            <div>
              <dt className="text-zinc-500">Assignee</dt>
              <dd>{assigneeName ?? "Unassigned"}</dd>
            </div>
          )}
        </dl>

        {canEdit && (
          <div className="mt-6">
            <TaskDetailForm
              taskId={task.id}
              clientId={clientId}
              initialStatus={task.status}
              initialDueDate={task.due_date ?? undefined}
              initialOutput={task.output ?? undefined}
            />
          </div>
        )}

        {!canEdit && task.output && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-zinc-400">Output</h3>
            <div className="mt-2 whitespace-pre-wrap rounded bg-zinc-800/50 p-3 text-sm">
              {task.output}
            </div>
          </div>
        )}
      </div>

      {task.task_checklist_items && task.task_checklist_items.length > 0 && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 sm:p-6">
          <h3 className="font-medium">Checklist</h3>
          <TaskChecklist
            taskId={task.id}
            clientId={clientId}
            items={task.task_checklist_items}
            canEdit={canEdit}
          />
        </div>
      )}
    </div>
  );
}
