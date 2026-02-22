"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { TaskChecklistItem as TaskChecklistItemType } from "@/types/database";

interface TaskChecklistProps {
  taskId: string;
  clientId: string;
  items: TaskChecklistItemType[];
  canEdit: boolean;
}

export function TaskChecklist({
  taskId,
  items,
  canEdit,
}: TaskChecklistProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleToggle(itemId: string, completed: boolean) {
    if (!canEdit) return;
    startTransition(async () => {
      const res = await fetch(
        `/api/tasks/${taskId}/checklist/${itemId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completed }),
        }
      );
      if (res.ok) router.refresh();
      else {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Failed to update checklist");
      }
    });
  }

  return (
    <ul className="mt-4 space-y-2">
      {items.map((item) => (
        <li key={item.id} className="flex items-center gap-3">
          <input
            type="checkbox"
            id={`check-${item.id}`}
            checked={item.completed}
            disabled={!canEdit || isPending}
            onChange={(e) => handleToggle(item.id, e.target.checked)}
            className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
          />
          <label
            htmlFor={`check-${item.id}`}
            className={
              item.completed
                ? "cursor-pointer text-sm text-zinc-500 line-through"
                : "cursor-pointer text-sm text-zinc-300"
            }
          >
            {item.label}
          </label>
        </li>
      ))}
    </ul>
  );
}
