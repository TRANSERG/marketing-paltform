import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthUser } from "@/lib/auth";
import { hasPermission } from "@/types/auth";
import { getRolesWithPermissions, getRoleUserCounts } from "@/lib/roles";
import { AddRoleForm } from "./AddRoleForm";
import { RoleRowActions } from "./RoleRowActions";

export default async function RolesPage() {
  const user = await getAuthUser();
  if (!hasPermission(user, "users.manage")) {
    redirect("/dashboard");
  }
  const [roles, userCounts] = await Promise.all([
    getRolesWithPermissions(),
    getRoleUserCounts(),
  ]);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium">Roles</h2>
      <div>
        <h3 className="mb-2 text-sm font-medium text-zinc-400">Add role</h3>
        <AddRoleForm />
      </div>
      <div className="rounded-lg border border-zinc-800 overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[600px]">
          <thead className="bg-zinc-900 text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 font-medium">Permissions</th>
              <th className="px-4 py-3 font-medium">Users</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {roles.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                  No roles yet.
                </td>
              </tr>
            ) : (
              roles.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3 text-zinc-400">{r.description ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className="text-zinc-400">
                      {r.permissions.length === 0
                        ? "—"
                        : r.permissions.join(", ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">{userCounts[r.id] ?? 0}</td>
                  <td className="px-4 py-3">
                    <RoleRowActions
                      roleId={r.id}
                      roleName={r.name}
                      userCount={userCounts[r.id] ?? 0}
                    />
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
