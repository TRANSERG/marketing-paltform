"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/Spinner";

interface UserRowActionsProps {
  userId: string;
  userEmail: string | null;
}

export function UserRowActions({ userId, userEmail }: UserRowActionsProps) {
  const router = useRouter();
  const [removing, setRemoving] = useState(false);

  async function handleRemove() {
    const email = userEmail ?? "this user";
    if (!confirm(`Remove ${email}? This cannot be undone.`)) return;
    setRemoving(true);
    const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    setRemoving(false);
    if (res.ok) router.refresh();
    else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Failed to remove user");
    }
  }

  return (
    <button
      type="button"
      onClick={handleRemove}
      disabled={removing}
      className="rounded border border-red-800 bg-transparent px-2 py-1 text-xs text-red-400 hover:bg-red-900/30 disabled:opacity-50 inline-flex items-center gap-1.5"
    >
      {removing ? (
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
