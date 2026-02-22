"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface DeleteRoleButtonProps {
  roleId: string;
  roleName: string;
}

export function DeleteRoleButton({ roleId, roleName }: DeleteRoleButtonProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleClick() {
    if (!confirm(`Delete role "${roleName}"? This cannot be undone.`)) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/roles/${roleId}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) {
      router.push("/dashboard/roles");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Failed to delete role");
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={deleting}
      className="rounded border border-red-800 px-3 py-1.5 text-sm text-red-400 hover:bg-red-900/30 disabled:opacity-50"
    >
      {deleting ? "Deleting…" : "Delete role"}
    </button>
  );
}
