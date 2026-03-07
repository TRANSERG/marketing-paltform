"use client";

import { useState } from "react";
import type { WorkingHoursDay } from "@/types/database";

const DAY_LABELS: Record<WorkingHoursDay["day"], string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

const DEFAULT_HOURS: WorkingHoursDay[] = [
  { day: "mon", open: "09:00", close: "18:00", closed: false },
  { day: "tue", open: "09:00", close: "18:00", closed: false },
  { day: "wed", open: "09:00", close: "18:00", closed: false },
  { day: "thu", open: "09:00", close: "18:00", closed: false },
  { day: "fri", open: "09:00", close: "18:00", closed: false },
  { day: "sat", open: "10:00", close: "16:00", closed: false },
  { day: "sun", open: "09:00", close: "18:00", closed: true },
];

interface WorkingHoursEditorProps {
  initialHours?: WorkingHoursDay[] | null;
}

export function WorkingHoursEditor({ initialHours }: WorkingHoursEditorProps) {
  const [hours, setHours] = useState<WorkingHoursDay[]>(
    initialHours?.length ? initialHours : DEFAULT_HOURS
  );

  const update = (day: WorkingHoursDay["day"], patch: Partial<WorkingHoursDay>) => {
    setHours((prev) =>
      prev.map((h) => (h.day === day ? { ...h, ...patch } : h))
    );
  };

  return (
    <div className="space-y-2">
      {hours.map((h) => (
        <div key={h.day} className="flex items-center gap-3 text-sm">
          {/* Hidden inputs so form submission picks these up */}
          <input type="hidden" name={`hours_${h.day}_open`}   value={h.open} />
          <input type="hidden" name={`hours_${h.day}_close`}  value={h.close} />

          <span className="w-24 text-zinc-400 shrink-0">{DAY_LABELS[h.day]}</span>

          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              name={`hours_${h.day}_closed`}
              checked={h.closed}
              onChange={(e) => update(h.day, { closed: e.target.checked })}
              className="accent-blue-500"
            />
            <span className="text-zinc-500">Closed</span>
          </label>

          <div className={`flex items-center gap-2 ${h.closed ? "opacity-30 pointer-events-none" : ""}`}>
            <input
              type="time"
              value={h.open}
              onChange={(e) => update(h.day, { open: e.target.value })}
              className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-zinc-500">–</span>
            <input
              type="time"
              value={h.close}
              onChange={(e) => update(h.day, { close: e.target.value })}
              className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
