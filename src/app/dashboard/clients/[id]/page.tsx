import Link from "next/link";
import { notFound } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { getClientById } from "@/lib/clients";
import { getAssignableUsers, getProfileDisplayName } from "@/lib/users";
import { getServicesWithStages } from "@/lib/services";
import { hasPermission } from "@/types/auth";
import { CloseDealButton } from "../CloseDealButton";
import { DeleteClientButton } from "../DeleteClientButton";
import { RemoveClientServiceButton } from "../RemoveClientServiceButton";
import { AssignOpsForm } from "../AssignOpsForm";
import { MoveStageSelect } from "../MoveStageSelect";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [user, { client, clientServices }] = await Promise.all([
    getAuthUser(),
    getClientById(id),
  ]);
  if (!client) notFound();
  const canUpdate =
    hasPermission(user, "clients.update") || hasPermission(user, "users.manage");
  const canCloseDeal =
    hasPermission(user, "clients.change_status_to_closed") ||
    hasPermission(user, "users.manage");
  const canAddService = canUpdate;
  const canAssignOps =
    hasPermission(user, "clients.assign_ops") || hasPermission(user, "users.manage");
  const canMoveStage =
    hasPermission(user, "client_services.update_stage") || hasPermission(user, "users.manage") || canUpdate;
  const canDelete =
    hasPermission(user, "clients.delete") || hasPermission(user, "users.manage");
  const showCloseDeal =
    canCloseDeal &&
    (client.status === "lead" || client.status === "qualified");

  const [assignableResult, servicesWithStages] = await Promise.all([
    canAssignOps
      ? Promise.all([
          getAssignableUsers(),
          client.assigned_ops_id ? getProfileDisplayName(client.assigned_ops_id) : Promise.resolve(null),
        ])
      : Promise.resolve([[] as { id: string; display_name: string | null }[], null] as const),
    canMoveStage && clientServices.length > 0 ? getServicesWithStages() : Promise.resolve([]),
  ]);
  const assignableUsers = canAssignOps ? assignableResult[0] : [];
  const assigneeName: string | null = canAssignOps ? assignableResult[1] : null;

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/dashboard/clients"
          className="text-sm text-zinc-400 hover:text-white min-h-[44px] flex items-center"
        >
          ← Clients
        </Link>
        <div className="flex flex-wrap gap-2">
          {canUpdate && (
            <Link
              href={`/dashboard/clients/${id}/edit`}
              className="rounded-lg border border-zinc-600 px-3 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 min-h-[44px] inline-flex items-center w-full sm:w-auto justify-center"
            >
              Edit
            </Link>
          )}
          {canDelete && (
            <DeleteClientButton clientId={id} clientName={client.name} />
          )}
        </div>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 sm:p-6">
        <h2 className="text-lg font-medium">{client.name}</h2>
        <dl className="mt-4 grid gap-2 text-sm">
          <div>
            <dt className="text-zinc-500">Status</dt>
            <dd className="capitalize">{client.status}</dd>
          </div>
          {client.contact_email && (
            <div>
              <dt className="text-zinc-500">Contact email</dt>
              <dd>{client.contact_email}</dd>
            </div>
          )}
          {client.contact_phone && (
            <div>
              <dt className="text-zinc-500">Contact phone</dt>
              <dd>{client.contact_phone}</dd>
            </div>
          )}
          {client.address && (
            <div>
              <dt className="text-zinc-500">Address</dt>
              <dd>{client.address}</dd>
            </div>
          )}
          <div>
            <dt className="text-zinc-500">Timezone</dt>
            <dd>{client.timezone ?? "UTC"}</dd>
          </div>
          {client.sold_at && (
            <div>
              <dt className="text-zinc-500">Sold at</dt>
              <dd>{new Date(client.sold_at).toLocaleString()}</dd>
            </div>
          )}
          {canAssignOps && (
            <div>
              <dt className="text-zinc-500">Assigned to</dt>
              <dd>
                {assigneeName ?? (client.assigned_ops_id ? client.assigned_ops_id.slice(0, 8) + "…" : "Unassigned")}
                <AssignOpsForm
                  clientId={id}
                  currentAssignedId={client.assigned_ops_id}
                  assignableUsers={assignableUsers}
                />
              </dd>
            </div>
          )}
        </dl>
        {showCloseDeal && (
          <div className="mt-4">
            <CloseDealButton clientId={id} />
          </div>
        )}
      </div>

      <div>
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-medium">Services</h3>
          {canAddService && (
            <Link
              href={`/dashboard/clients/${id}/add-service`}
              className="rounded-lg bg-blue-600 px-3 py-2.5 text-sm text-white hover:bg-blue-700 min-h-[44px] inline-flex items-center justify-center w-full sm:w-auto"
            >
              Add service
            </Link>
          )}
        </div>
        <div className="rounded-lg border border-zinc-800 overflow-hidden overflow-x-auto">
          {clientServices.length === 0 ? (
            <p className="px-4 py-6 text-center text-zinc-500">
              No services added yet.
              {canAddService && " Add one to get started."}
            </p>
          ) : (
            <table className="w-full text-left text-sm min-w-[500px]">
              <thead className="bg-zinc-900 text-zinc-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Service</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Current stage</th>
                  {canMoveStage && <th className="px-4 py-3 font-medium">Move stage</th>}
                  {canUpdate && <th className="px-4 py-3" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {clientServices.map((cs) => (
                  <tr key={cs.id}>
                    <td className="px-4 py-3">{cs.service?.name ?? "—"}</td>
                    <td className="px-4 py-3 capitalize">{cs.status}</td>
                    <td className="px-4 py-3">
                      {cs.current_stage?.name ?? "—"}
                    </td>
                    {canMoveStage && (
                      <td className="px-4 py-3">
                        <MoveStageSelect
                          clientServiceId={cs.id}
                          serviceId={cs.service_id}
                          currentStageId={cs.current_stage?.id}
                          stages={servicesWithStages.find((s) => s.id === cs.service_id)?.service_stages ?? []}
                        />
                      </td>
                    )}
                    {canUpdate && (
                      <td className="px-4 py-3">
                        <RemoveClientServiceButton
                          clientServiceId={cs.id}
                          clientId={id}
                        />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
