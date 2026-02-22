import Link from "next/link";
import { getAuthUser } from "@/lib/auth";
import { getPipelineCounts } from "@/lib/clients";
import { hasPermission } from "@/types/auth";

const PIPELINE_LABELS: Record<string, string> = {
  lead: "Leads",
  qualified: "Qualified",
  closed: "Closed",
  active: "Active",
  churned: "Churned",
};

export default async function DashboardPage() {
  const user = await getAuthUser();
  const canSeeClients =
    hasPermission(user, "clients.read") || hasPermission(user, "users.manage");
  const counts = canSeeClients ? await getPipelineCounts() : null;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium">Dashboard</h2>
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 sm:p-6">
        <p className="text-zinc-400">
          Welcome. You are logged in as{" "}
          <strong className="text-white">
            {user?.user_role ?? "authenticated"}
          </strong>
          {user?.email && <> ({user.email})</>}.
        </p>
        <p className="mt-2 text-sm text-zinc-500">
          Use the menu to open Clients, Settings (admin), or Users (admin).
        </p>
      </div>
      {counts && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 sm:p-6">
          <h3 className="font-medium">Pipeline</h3>
          <div className="mt-3 flex flex-wrap gap-3">
            {(["lead", "qualified", "closed", "active", "churned"] as const).map(
              (status) => (
                <Link
                  key={status}
                  href={
                    status === "lead"
                      ? "/dashboard/clients?status=lead"
                      : `/dashboard/clients?status=${status}`
                  }
                  className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-sm hover:bg-zinc-800 min-h-[44px] flex items-center"
                >
                  <span className="text-zinc-400">
                    {PIPELINE_LABELS[status] ?? status}
                  </span>{" "}
                  <span className="font-medium text-white">
                    {counts[status] ?? 0}
                  </span>
                </Link>
              )
            )}
          </div>
          <p className="mt-3 text-sm text-zinc-500">
            <Link href="/dashboard/clients" className="text-blue-400 hover:underline min-h-[44px] inline-flex items-center">
              View all clients →
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
