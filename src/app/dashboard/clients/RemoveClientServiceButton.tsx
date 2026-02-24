"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/Spinner";

export function RemoveClientServiceButton({
  clientServiceId,
  clientId,
}: {
  clientServiceId: string;
  clientId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleRemove() {
    if (!confirm("Remove this service from the client?")) return;
    startTransition(async () => {
      const res = await fetch(
        `/api/clients/${clientId}/client-services/${clientServiceId}`,
        { method: "DELETE" }
      );
      if (res.ok) router.refresh();
      else {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Failed to remove service");
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleRemove}
      disabled={isPending}
      className="text-sm text-red-400 hover:text-red-300 disabled:opacity-50 inline-flex items-center gap-1.5"
    >
      {isPending ? (
        <>
          <Spinner size="sm" className="h-3 w-3 shrink-0" />
          Removing…
        </>
      ) : (
        "Remove"
      )}
    </button>
  );
}
