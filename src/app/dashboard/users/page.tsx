import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { hasPermission } from "@/types/auth";
import { getAdminUsersList, getRoles } from "@/lib/users";
import { AddUserForm } from "./AddUserForm";
import { UserRoleSelect } from "./UserRoleSelect";
import { UserRowActions } from "./UserRowActions";

export default async function UsersPage() {
  const user = await getAuthUser();
  const canManage = hasPermission(user, "users.manage");
  if (!canManage) {
    redirect("/dashboard");
  }
  const [users, roles] = await Promise.all([getAdminUsersList(), getRoles()]);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium">Users</h2>
      <div>
        <h3 className="mb-2 text-sm font-medium text-zinc-400">Add user</h3>
        <AddUserForm roles={roles} />
      </div>
      <div className="rounded-lg border border-zinc-800 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-900 text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Display name</th>
              <th className="px-4 py-3 font-medium">Roles</th>
              <th className="px-4 py-3 font-medium">Change role</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                  No users yet, or service role key not set.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3">{u.email ?? "—"}</td>
                  <td className="px-4 py-3">{u.display_name ?? "—"}</td>
                  <td className="px-4 py-3">{u.roles.join(", ") || "—"}</td>
                  <td className="px-4 py-3">
                    <UserRoleSelect
                      userId={u.id}
                      currentRoles={u.roles}
                      roles={roles}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <UserRowActions userId={u.id} userEmail={u.email} />
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
