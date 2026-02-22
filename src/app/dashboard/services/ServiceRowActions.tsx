"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ServiceRowActionsProps {
  serviceId: string;
  serviceName: string;
  clientCount: number;
  canEdit: boolean;
  canDelete: boolean;
}

export function ServiceRowActions({
  serviceId,
  serviceName,
  clientCount,
  canEdit,
  canDelete,
}: ServiceRowActionsProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (clientCount > 0) {
      alert(
        `This service is used by ${clientCount} client(s). Deleting will remove it from those clients and delete all related tasks. This cannot be undone.`
      );
    }
    if (!confirm(`Delete service "${serviceName}"? This cannot be undone.`))
      return;
    setDeleting(true);
    const res = await fetch(`/api/services/${serviceId}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) router.refresh();
    else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Failed to delete service");
    }
  }

  return (
    <div className="flex items-center gap-2">
      {canEdit && (
        <Link
          href={`/dashboard/services/${serviceId}`}
          className="rounded border border-zinc-600 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800"
        >
          View
        </Link>
      )}
      {canEdit && (
        <Link
          href={`/dashboard/services/${serviceId}/edit`}
          className="rounded border border-zinc-600 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800"
        >
          Edit
        </Link>
      )}
      {canDelete && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="rounded border border-red-800 px-2 py-1 text-xs text-red-400 hover:bg-red-900/30 disabled:opacity-50"
        >
          {deleting ? "Deleting…" : "Delete"}
        </button>
      )}
    </div>
  );
}
