"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/Spinner";
import type { AssignableUser } from "@/lib/users";

interface AssignOpsFormProps {
  clientId: string;
  currentAssignedId: string | null;
  assignableUsers: AssignableUser[];
}

export function AssignOpsForm({
  clientId,
  currentAssignedId,
  assignableUsers,
}: AssignOpsFormProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const assignedOpsId = formData.get("assigned_ops_id") as string;
    const value = assignedOpsId === "__none__" ? null : assignedOpsId;
    startTransition(async () => {
      const res = await fetch(`/api/clients/${clientId}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigned_ops_id: value }),
      });
      if (res.ok) router.refresh();
      else {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Failed to assign");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex items-center gap-2">
      <select
        name="assigned_ops_id"
        defaultValue={currentAssignedId ?? "__none__"}
        disabled={isPending}
        className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="__none__">Unassigned</option>
        {assignableUsers.map((u) => (
          <option key={u.id} value={u.id}>
            {u.display_name ?? u.id.slice(0, 8)}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={isPending}
        className="rounded bg-zinc-700 px-3 py-1.5 text-sm text-white hover:bg-zinc-600 disabled:opacity-50 inline-flex items-center gap-1.5"
      >
        {isPending ? (
          <>
            <Spinner size="sm" className="h-3 w-3 shrink-0" />
            Saving…
          </>
        ) : (
          "Assign"
        )}
      </button>
    </form>
  );
}
