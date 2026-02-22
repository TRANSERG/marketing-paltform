import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getAuthUser } from "@/lib/auth";
import { hasPermission } from "@/types/auth";
import { getRoleById, countUsersWithRole } from "@/lib/roles";
import { EditRoleForm } from "@/app/dashboard/roles/EditRoleForm";
import { DeleteRoleButton } from "@/app/dashboard/roles/DeleteRoleButton";

export default async function EditRolePage({
  params,
}: {
  params: Promise<{ roleId: string }>;
}) {
  const user = await getAuthUser();
  if (!hasPermission(user, "users.manage")) {
    redirect("/dashboard");
  }
  const { roleId } = await params;
  const [role, userCount] = await Promise.all([
    getRoleById(roleId),
    countUsersWithRole(roleId),
  ]);
  if (!role) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/roles"
          className="text-sm text-zinc-400 hover:text-white"
        >
          ← Roles
        </Link>
        {userCount === 0 && (
          <DeleteRoleButton roleId={roleId} roleName={role.name} />
        )}
      </div>
      <h2 className="text-lg font-medium">Edit role: {role.name}</h2>
      <EditRoleForm
        roleId={roleId}
        initialName={role.name}
        initialDescription={role.description ?? ""}
        initialPermissions={role.permissions}
      />
      {userCount > 0 && (
        <p className="text-sm text-zinc-500">
          {userCount} user(s) have this role. Remove the role from all users before deleting.
        </p>
      )}
    </div>
  );
}
