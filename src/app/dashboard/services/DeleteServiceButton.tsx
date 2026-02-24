"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/Spinner";

interface DeleteServiceButtonProps {
  serviceId: string;
  serviceName: string;
  clientCount: number;
}

export function DeleteServiceButton({
  serviceId,
  serviceName,
  clientCount,
}: DeleteServiceButtonProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (clientCount > 0) {
      const ok = confirm(
        `This service is used by ${clientCount} client(s). Deleting will remove it from those clients and delete all related tasks. Continue?`
      );
      if (!ok) return;
    } else {
      if (!confirm(`Delete service "${serviceName}"? This cannot be undone.`))
        return;
    }
    setDeleting(true);
    const res = await fetch(`/api/services/${serviceId}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) router.push("/dashboard/services");
    else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Failed to delete service");
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className="rounded-lg border border-red-800 px-3 py-2.5 text-sm text-red-400 hover:bg-red-900/30 disabled:opacity-50 min-h-[44px] inline-flex items-center gap-2"
    >
      {deleting ? (
        <>
          <Spinner size="sm" className="shrink-0" />
          Deleting…
        </>
      ) : (
        "Delete service"
      )}
    </button>
  );
}
