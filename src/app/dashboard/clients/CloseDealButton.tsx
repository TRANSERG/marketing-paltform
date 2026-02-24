"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/Spinner";

export function CloseDealButton({ clientId }: { clientId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleClose() {
    if (!confirm("Mark this deal as closed?")) return;
    startTransition(async () => {
      const res = await fetch(`/api/clients/${clientId}/close-deal`, {
        method: "POST",
      });
      if (res.ok) router.refresh();
      else {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Failed to close deal");
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClose}
      disabled={isPending}
      className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 inline-flex items-center gap-2"
    >
      {isPending ? (
        <>
          <Spinner size="sm" className="shrink-0" />
          Closing…
        </>
      ) : (
        "Close deal"
      )}
    </button>
  );
}
