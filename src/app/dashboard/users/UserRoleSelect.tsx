"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface UserRoleSelectProps {
  userId: string;
  currentRoles: string[];
  roles: { id: string; name: string }[];
}

export function UserRoleSelect({ userId, currentRoles, roles }: UserRoleSelectProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const currentRoleId = roles.find((r) => currentRoles.includes(r.name))?.id ?? roles[0]?.id;

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const roleId = e.target.value;
    if (!roleId) return;
    setLoading(true);
    const res = await fetch(`/api/admin/users/${userId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role_id: roleId }),
    });
    setLoading(false);
    if (res.ok) router.refresh();
    else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Failed to update role");
    }
  }

  return (
    <select
      defaultValue={currentRoleId}
      disabled={loading}
      onChange={handleChange}
      className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
    >
      {roles.map((r) => (
        <option key={r.id} value={r.id}>
          {r.name}
        </option>
      ))}
    </select>
  );
}
