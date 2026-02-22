import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { getServiceById, getClientServiceCounts } from "@/lib/services";
import { hasPermission } from "@/types/auth";
import { DeleteServiceButton } from "../DeleteServiceButton";

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getAuthUser();
  if (
    !hasPermission(user, "services.update") &&
    !hasPermission(user, "task_templates.read") &&
    !hasPermission(user, "users.manage")
  ) {
    redirect("/dashboard");
  }
  const [service, clientCounts] = await Promise.all([
    getServiceById(id),
    getClientServiceCounts(),
  ]);
  if (!service) notFound();
  const canEdit =
    hasPermission(user, "services.update") || hasPermission(user, "users.manage");
  const canDelete =
    hasPermission(user, "services.delete") || hasPermission(user, "users.manage");
  const clientCount = clientCounts[id] ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/dashboard/services"
          className="text-sm text-zinc-400 hover:text-white min-h-[44px] flex items-center"
        >
          ← Services
        </Link>
        <div className="flex gap-2">
          {canEdit && (
            <Link
              href={`/dashboard/services/${id}/edit`}
              className="rounded-lg border border-zinc-600 px-3 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 min-h-[44px] inline-flex items-center"
            >
              Edit
            </Link>
          )}
          {canDelete && (
            <DeleteServiceButton
              serviceId={id}
              serviceName={service.name}
              clientCount={clientCount}
            />
          )}
        </div>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 sm:p-6">
        <h2 className="text-lg font-medium">{service.name}</h2>
        {service.description && (
          <p className="mt-2 text-sm text-zinc-400">{service.description}</p>
        )}
        {clientCount > 0 && (
          <p className="mt-2 text-sm text-zinc-500">
            Used by {clientCount} client{clientCount !== 1 ? "s" : ""}.
          </p>
        )}
      </div>

      <div>
        <h3 className="mb-3 font-medium">Task templates</h3>
        <p className="mb-4 text-sm text-zinc-400">
          When a client is assigned this service, one task is created per template (with optional checklist).
        </p>
        {service.task_templates.length === 0 ? (
          <p className="rounded-lg border border-zinc-800 px-4 py-6 text-center text-sm text-zinc-500">
            No task templates yet.
            {canEdit && " Edit this service to add task templates."}
          </p>
        ) : (
          <div className="rounded-lg border border-zinc-800 overflow-hidden overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[500px]">
              <thead className="bg-zinc-900 text-zinc-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Due offset (days)</th>
                  <th className="px-4 py-3 font-medium">Checklist items</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {service.task_templates.map((t, idx) => (
                  <tr key={t.id}>
                    <td className="px-4 py-3 text-zinc-400">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium">{t.name}</td>
                    <td className="px-4 py-3 text-zinc-400">
                      {t.default_due_offset_days ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      {t.task_template_checklist?.length ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
