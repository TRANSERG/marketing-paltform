import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { getServicesWithTaskTemplates, getClientServiceCounts } from "@/lib/services";
import { hasPermission } from "@/types/auth";
import { ServiceRowActions } from "./ServiceRowActions";

export default async function ServicesPage() {
  const user = await getAuthUser();
  if (
    !hasPermission(user, "services.update") &&
    !hasPermission(user, "task_templates.read") &&
    !hasPermission(user, "users.manage")
  ) {
    redirect("/dashboard");
  }
  const [services, clientCounts] = await Promise.all([
    getServicesWithTaskTemplates(),
    getClientServiceCounts(),
  ]);
  const canEdit =
    hasPermission(user, "services.update") || hasPermission(user, "users.manage");
  const canCreate =
    hasPermission(user, "services.create") || hasPermission(user, "users.manage");
  const canDelete =
    hasPermission(user, "services.delete") || hasPermission(user, "users.manage");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-medium">Services</h2>
        {canCreate && (
          <Link
            href="/dashboard/services/new"
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 min-h-[44px] inline-flex items-center justify-center w-full sm:w-auto"
          >
            New service
          </Link>
        )}
      </div>

      <p className="text-sm text-zinc-400">
        Services are the catalog of offerings. Each service has task templates that become tasks when a client is assigned the service.
      </p>

      <div className="rounded-lg border border-zinc-800 overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[600px]">
          <thead className="bg-zinc-900 text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 font-medium">Task templates</th>
              {(canEdit || canDelete) && (
                <th className="px-4 py-3 font-medium">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {services.length === 0 ? (
              <tr>
                <td
                  colSpan={canEdit || canDelete ? 4 : 3}
                  className="px-4 py-8 text-center text-zinc-500"
                >
                  No services yet. {canCreate && "Create one to get started."}
                </td>
              </tr>
            ) : (
              services.map((s) => (
                <tr key={s.id} className="hover:bg-zinc-900/50">
                  <td className="px-4 py-3">
                    {canEdit ? (
                      <Link
                        href={`/dashboard/services/${s.id}`}
                        className="font-medium text-white hover:underline"
                      >
                        {s.name}
                      </Link>
                    ) : (
                      <span className="font-medium text-white">{s.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-400 max-w-xs truncate">
                    {s.description ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {s.task_templates.length} template
                    {s.task_templates.length !== 1 ? "s" : ""}
                  </td>
                  {(canEdit || canDelete) && (
                    <td className="px-4 py-3">
                      <ServiceRowActions
                        serviceId={s.id}
                        serviceName={s.name}
                        clientCount={clientCounts[s.id] ?? 0}
                        canEdit={canEdit}
                        canDelete={canDelete}
                      />
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
