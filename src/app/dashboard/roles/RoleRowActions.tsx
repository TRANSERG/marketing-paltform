"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface RoleRowActionsProps {
  roleId: string;
  roleName: string;
  userCount: number;
}

export function RoleRowActions({ roleId, roleName, userCount }: RoleRowActionsProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (userCount > 0) {
      alert(`Cannot delete: ${userCount} user(s) have this role. Remove the role from all users first.`);
      return;
    }
    if (!confirm(`Delete role "${roleName}"? This cannot be undone.`)) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/roles/${roleId}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) router.refresh();
    else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Failed to delete role");
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/dashboard/roles/${roleId}/edit`}
        className="rounded border border-zinc-600 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800"
      >
        Edit
      </Link>
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting || userCount > 0}
        className="rounded border border-red-800 px-2 py-1 text-xs text-red-400 hover:bg-red-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {deleting ? "Deleting…" : "Delete"}
      </button>
    </div>
  );
}
