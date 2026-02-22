import Link from "next/link";
import { getAuthUser } from "@/lib/auth";
import { getClients } from "@/lib/clients";
import { hasPermission } from "@/types/auth";

export default async function MyClientsPage() {
  const user = await getAuthUser();
  const canSee = hasPermission(user, "client_services.update_stage");
  if (!canSee) {
    return (
      <div className="space-y-6">
        <h2 className="text-lg font-medium">My clients</h2>
        <p className="text-zinc-400">You don’t have access to this page.</p>
      </div>
    );
  }
  const clients = await getClients();
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium">My clients</h2>
      <p className="text-sm text-zinc-400">
        Clients assigned to you. With RLS, only your assigned clients are listed.
      </p>
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
                  No clients assigned to you yet.
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
    </div>
  );
}
