import Link from "next/link";
import { notFound } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { getClientById } from "@/lib/clients";
import {
  getClientProfile,
  getClientBrand,
  getClientOfferings,
  getClientTeamMembers,
} from "@/lib/client-profile";
import { getAssignableUsers, getProfileDisplayName } from "@/lib/users";
import { getServicesWithStages } from "@/lib/services";
import { getTasksByClientId } from "@/lib/tasks";
import { hasPermission } from "@/types/auth";
import { ClientTabs } from "../ClientTabs";
import { CloseDealButton } from "../CloseDealButton";
import { DeleteClientButton } from "../DeleteClientButton";
import { RemoveClientServiceButton } from "../RemoveClientServiceButton";
import { AssignOpsForm } from "../AssignOpsForm";
import { MoveStageSelect } from "../MoveStageSelect";
import { ProfileForm } from "../ProfileForm";
import { BrandForm } from "../BrandForm";
import { OfferingsManager } from "../OfferingsManager";
import { TeamManager } from "../TeamManager";
import { upsertProfileAction } from "../actions/profile";
import { upsertBrandAction } from "../actions/brand";
import {
  createOfferingAction,
  updateOfferingAction,
  deleteOfferingAction,
} from "../actions/offerings";
import {
  createTeamMemberAction,
  updateTeamMemberAction,
  deleteTeamMemberAction,
} from "../actions/team";

type Tab = "overview" | "profile" | "brand" | "offerings" | "team" | "media";

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab: rawTab = "overview" } = await searchParams;
  const tab = rawTab as Tab;

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
  const canAssignOps =
    hasPermission(user, "clients.assign_ops") || hasPermission(user, "users.manage");
  const canMoveStage =
    hasPermission(user, "client_services.update_stage") ||
    hasPermission(user, "users.manage") ||
    canUpdate;
  const canDelete =
    hasPermission(user, "clients.delete") || hasPermission(user, "users.manage");
  const showCloseDeal =
    canCloseDeal &&
    (client.status === "lead" || client.status === "qualified");

  // ── Per-tab data fetching ────────────────────────────────────────────────
  const [assignableResult, servicesWithStages, tasksForClient, profileData, brandData, offerings, teamMembers] =
    await Promise.all([
      canAssignOps
        ? Promise.all([
            getAssignableUsers(),
            client.assigned_ops_id
              ? getProfileDisplayName(client.assigned_ops_id)
              : Promise.resolve(null),
          ])
        : Promise.resolve([
            [] as { id: string; display_name: string | null }[],
            null,
          ] as const),
      tab === "overview" && canMoveStage && clientServices.length > 0
        ? getServicesWithStages()
        : Promise.resolve([]),
      tab === "overview" ? getTasksByClientId(id) : Promise.resolve([]),
      tab === "profile" ? getClientProfile(id) : Promise.resolve(null),
      tab === "brand"   ? getClientBrand(id)   : Promise.resolve(null),
      tab === "offerings" ? getClientOfferings(id) : Promise.resolve([]),
      tab === "team"    ? getClientTeamMembers(id) : Promise.resolve([]),
    ]);

  const assignableUsers = canAssignOps ? (assignableResult as [{ id: string; display_name: string | null }[], string | null])[0] : [];
  const assigneeName    = canAssignOps ? (assignableResult as [{ id: string; display_name: string | null }[], string | null])[1] : null;
  const canUpdateTask   = canMoveStage || canUpdate;

  // ── Bound server actions ─────────────────────────────────────────────────
  async function boundUpsertProfile(
    prev: { error?: string } | undefined,
    formData: FormData
  ) {
    "use server";
    return upsertProfileAction(id, prev, formData);
  }

  async function boundUpsertBrand(
    prev: { error?: string } | undefined,
    formData: FormData
  ) {
    "use server";
    return upsertBrandAction(id, prev, formData);
  }

  async function boundCreateOffering(
    prev: { error?: string } | undefined,
    formData: FormData
  ) {
    "use server";
    return createOfferingAction(id, prev, formData);
  }

  async function boundUpdateOffering(
    offeringId: string,
    prev: { error?: string } | undefined,
    formData: FormData
  ) {
    "use server";
    return updateOfferingAction(offeringId, prev, formData);
  }

  async function boundDeleteOffering(offeringId: string) {
    "use server";
    return deleteOfferingAction(offeringId);
  }

  async function boundCreateTeamMember(
    prev: { error?: string } | undefined,
    formData: FormData
  ) {
    "use server";
    return createTeamMemberAction(id, prev, formData);
  }

  async function boundUpdateTeamMember(
    memberId: string,
    prev: { error?: string } | undefined,
    formData: FormData
  ) {
    "use server";
    return updateTeamMemberAction(memberId, prev, formData);
  }

  async function boundDeleteTeamMember(memberId: string) {
    "use server";
    return deleteTeamMemberAction(memberId);
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/dashboard/clients"
            className="text-sm text-zinc-400 hover:text-white min-h-[44px] flex items-center"
          >
            ← Clients
          </Link>
          <h2 className="mt-1 text-xl font-semibold">{client.name}</h2>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="capitalize text-sm text-zinc-400">{client.status}</span>
            {client.business_category && (
              <>
                <span className="text-zinc-700">·</span>
                <span className="text-sm text-zinc-400">{client.business_category}</span>
              </>
            )}
            {client.tagline && (
              <>
                <span className="text-zinc-700">·</span>
                <span className="text-sm italic text-zinc-500">{client.tagline}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {canUpdate && (
            <Link
              href={`/dashboard/clients/${id}/edit`}
              className="rounded-lg border border-zinc-600 px-3 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 min-h-[44px] inline-flex items-center w-full sm:w-auto justify-center"
            >
              Edit
            </Link>
          )}
          {canDelete && <DeleteClientButton clientId={id} clientName={client.name} />}
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <ClientTabs clientId={id} activeTab={tab} />

      {/* ── Tab content ─────────────────────────────────────────────────── */}

      {/* Overview */}
      {tab === "overview" && (
        <div className="space-y-6">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 sm:p-6">
            <h3 className="font-medium">Client Info</h3>
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
              {client.website && (
                <div>
                  <dt className="text-zinc-500">Website</dt>
                  <dd>
                    <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                      {client.website}
                    </a>
                  </dd>
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
                    {assigneeName ??
                      (client.assigned_ops_id
                        ? client.assigned_ops_id.slice(0, 8) + "…"
                        : "Unassigned")}
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

          {/* Services */}
          <div>
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="font-medium">Services</h3>
              {canUpdate && (
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
                  No services added yet.{canUpdate && " Add one to get started."}
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
                        <td className="px-4 py-3">{cs.current_stage?.name ?? "—"}</td>
                        {canMoveStage && (
                          <td className="px-4 py-3">
                            <MoveStageSelect
                              clientServiceId={cs.id}
                              serviceId={cs.service_id}
                              currentStageId={cs.current_stage?.id}
                              stages={
                                servicesWithStages.find((s) => s.id === cs.service_id)
                                  ?.service_stages ?? []
                              }
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

          {/* Tasks */}
          {tasksForClient.length > 0 && (
            <div>
              <h3 className="mb-3 font-medium">Tasks</h3>
              <div className="rounded-lg border border-zinc-800 overflow-hidden overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[500px]">
                  <thead className="bg-zinc-900 text-zinc-400">
                    <tr>
                      <th className="px-4 py-3 font-medium">Service</th>
                      <th className="px-4 py-3 font-medium">Task</th>
                      <th className="px-4 py-3 font-medium">Due date</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      {canUpdateTask && <th className="px-4 py-3 font-medium">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {tasksForClient.map((task) => {
                      const cs = clientServices.find((c) => c.id === task.client_service_id);
                      const serviceName = cs?.service?.name ?? "—";
                      const displayStatus =
                        task.status === "overdue" ||
                        (task.due_date &&
                          task.status !== "completed" &&
                          task.status !== "cancelled" &&
                          new Date(task.due_date) < new Date())
                          ? "overdue"
                          : task.status;
                      return (
                        <tr key={task.id}>
                          <td className="px-4 py-3">{serviceName}</td>
                          <td className="px-4 py-3">
                            {task.title ?? task.task_template?.name ?? "—"}
                          </td>
                          <td className="px-4 py-3">
                            {task.due_date
                              ? new Date(task.due_date).toLocaleDateString()
                              : "—"}
                          </td>
                          <td className="px-4 py-3 capitalize">{displayStatus}</td>
                          {canUpdateTask && (
                            <td className="px-4 py-3">
                              <Link
                                href={`/dashboard/clients/${id}/tasks/${task.id}`}
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
              </div>
            </div>
          )}
        </div>
      )}

      {/* Business Profile */}
      {tab === "profile" && (
        <div>
          {canUpdate ? (
            <ProfileForm
              client={client}
              profile={profileData}
              action={boundUpsertProfile}
            />
          ) : (
            <p className="text-sm text-zinc-500">You don&apos;t have permission to edit the profile.</p>
          )}
        </div>
      )}

      {/* Brand */}
      {tab === "brand" && (
        <div>
          {canUpdate ? (
            <BrandForm brand={brandData} action={boundUpsertBrand} />
          ) : (
            <p className="text-sm text-zinc-500">You don&apos;t have permission to edit brand settings.</p>
          )}
        </div>
      )}

      {/* Offerings */}
      {tab === "offerings" && (
        <OfferingsManager
          clientId={id}
          initialOfferings={offerings}
          canUpdate={canUpdate}
          createAction={boundCreateOffering}
          updateAction={boundUpdateOffering}
          deleteAction={boundDeleteOffering}
        />
      )}

      {/* Team */}
      {tab === "team" && (
        <TeamManager
          clientId={id}
          initialMembers={teamMembers}
          canUpdate={canUpdate}
          createAction={boundCreateTeamMember}
          updateAction={boundUpdateTeamMember}
          deleteAction={boundDeleteTeamMember}
        />
      )}

      {/* Media */}
      {tab === "media" && (
        <div className="py-8 text-center text-zinc-500 text-sm">
          Media library coming soon — upload photos, videos, and design assets.
        </div>
      )}
    </div>
  );
}
