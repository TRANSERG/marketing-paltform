"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CreateNextOccurrenceButton({
  taskId,
  clientId,
}: {
  taskId: string;
  clientId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/next-occurrence`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error ?? "Failed to create next occurrence");
        return;
      }
      const newTaskId = data.taskId;
      if (newTaskId) {
        router.push(`/dashboard/clients/${clientId}/tasks/${newTaskId}`);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="rounded bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
    >
      {loading ? "Creating…" : "Create next occurrence"}
    </button>
  );
}
