"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export function DeleteClientButton({ clientId, clientName }: { clientId: string; clientName: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`Delete client “${clientName}”? This cannot be undone.`)) return;
    startTransition(async () => {
      const res = await fetch(`/api/clients/${clientId}`, { method: "DELETE" });
      if (res.ok) router.push("/dashboard/clients");
      else {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Failed to delete client");
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="rounded-lg border border-red-800 bg-red-950/50 px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-900/30 hover:text-red-300 disabled:opacity-50 min-h-[48px]"
    >
      {isPending ? "Deleting…" : "Delete client"}
    </button>
  );
}
