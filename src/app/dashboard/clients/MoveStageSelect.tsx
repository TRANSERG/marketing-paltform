"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

interface Stage {
  id: string;
  name: string;
  sort_order: number;
}

interface MoveStageSelectProps {
  clientServiceId: string;
  serviceId: string;
  currentStageId: string | undefined;
  stages: Stage[];
}

export function MoveStageSelect({
  clientServiceId,
  currentStageId,
  stages,
}: MoveStageSelectProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const serviceStageId = e.target.value;
    if (!serviceStageId) return;
    startTransition(async () => {
      const res = await fetch(`/api/client-services/${clientServiceId}/move-stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service_stage_id: serviceStageId }),
      });
      if (res.ok) router.refresh();
      else {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Failed to update stage");
      }
    });
  }

  if (stages.length === 0) return <span className="text-zinc-500">—</span>;

  return (
    <select
      defaultValue={currentStageId ?? ""}
      disabled={isPending}
      onChange={handleChange}
      className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
    >
      <option value="">—</option>
      {stages.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
        </option>
      ))}
    </select>
  );
}
