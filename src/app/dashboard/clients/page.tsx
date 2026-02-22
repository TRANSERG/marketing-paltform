import Link from "next/link";
import { getAuthUser } from "@/lib/auth";
import { getClients, getClientsCount } from "@/lib/clients";
import { hasPermission } from "@/types/auth";
import type { ClientStatus } from "@/types/database";

const PAGE_SIZE = 25;
const STATUS_OPTIONS: { value: ClientStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "lead", label: "Lead" },
  { value: "qualified", label: "Qualified" },
  { value: "closed", label: "Closed" },
  { value: "active", label: "Active" },
  { value: "churned", label: "Churned" },
];

function buildClientsUrl(params: { status?: string; page?: number }) {
  const search = new URLSearchParams();
  if (params.status) search.set("status", params.status);
  if (params.page != null && params.page > 1) search.set("page", String(params.page));
  const q = search.toString();
  return `/dashboard/clients${q ? `?${q}` : ""}`;
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const user = await getAuthUser();
  const params = await searchParams;
  const statusParam = params.status;
  const validStatus =
    statusParam &&
    statusParam !== "all" &&
    (["lead", "qualified", "closed", "active", "churned"] as const).includes(
      statusParam as ClientStatus
    )
      ? (statusParam as ClientStatus)
      : undefined;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;
  const filters = validStatus ? { status: validStatus } : undefined;

  const [clients, total] = await Promise.all([
    getClients(filters, { limit: PAGE_SIZE, offset }),
    getClientsCount(filters),
  ]);
  const canCreate = hasPermission(user, "clients.create") || hasPermission(user, "users.manage");
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Clients</h2>
        {canCreate && (
          <Link
            href="/dashboard/clients/new"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            New client
          </Link>
        )}
      </div>

      <div className="flex gap-2">
        {STATUS_OPTIONS.map((opt) => (
          <Link
            key={opt.value}
            href={buildClientsUrl({
              status: opt.value === "all" ? undefined : opt.value,
              page: 1,
            })}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              (opt.value === "all" && !validStatus) || validStatus === opt.value
                ? "bg-zinc-700 text-white"
                : "bg-zinc-800 text-zinc-400 hover:text-white"
            }`}
          >
            {opt.label}
          </Link>
        ))}
      </div>

      <div className="rounded-lg border border-zinc-800 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-900 text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {clients.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                  No clients yet. {canCreate && "Create one to get started."}
                </td>
              </tr>
            ) : (
              clients.map((c) => (
                <tr key={c.id} className="hover:bg-zinc-900/50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/clients/${c.id}`}
                      className="font-medium text-white hover:underline"
                    >
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{c.contact_email ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-zinc-700 px-2 py-0.5 capitalize">
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/clients/${c.id}`}
                      className="text-blue-400 hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm text-zinc-400">
          <span>
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
          </span>
          <div className="flex gap-2">
            {hasPrev && (
              <Link
                href={buildClientsUrl({ status: validStatus, page: page - 1 })}
                className="rounded bg-zinc-800 px-3 py-1.5 hover:bg-zinc-700"
              >
                Previous
              </Link>
            )}
            {hasNext && (
              <Link
                href={buildClientsUrl({ status: validStatus, page: page + 1 })}
                className="rounded bg-zinc-800 px-3 py-1.5 hover:bg-zinc-700"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
