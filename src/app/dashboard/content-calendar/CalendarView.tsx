"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Client, ContentPost, PostPlatform, PostStatus } from "@/types/database";
import { PostModal } from "./PostModal";

// ─── Helpers ────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Pad a number to 2 digits */
const pad = (n: number) => String(n).padStart(2, "0");

/** Format as YYYY-MM-DD */
function toDateKey(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** Build calendar grid: array of weeks (7-cell rows), null = padding */
function buildCalendarGrid(year: number, month: number): (number | null)[][] {
  const firstDay = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);
  // Split into weeks
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

// ─── Platform colours ───────────────────────────────────────────────────────

const PLATFORM_COLORS: Record<PostPlatform, string> = {
  instagram: "bg-pink-900/60 text-pink-300 border-pink-800",
  facebook:  "bg-blue-900/60 text-blue-300 border-blue-800",
  linkedin:  "bg-indigo-900/60 text-indigo-300 border-indigo-800",
  twitter:   "bg-sky-900/60 text-sky-300 border-sky-800",
  tiktok:    "bg-red-900/60 text-red-300 border-red-800",
};

const PLATFORM_LABELS: Record<PostPlatform, string> = {
  instagram: "IG",
  facebook:  "FB",
  linkedin:  "LI",
  twitter:   "TW",
  tiktok:    "TT",
};

const STATUS_DOT: Record<PostStatus, string> = {
  draft:     "bg-zinc-400",
  scheduled: "bg-yellow-400",
  published: "bg-green-400",
};

// ─── Component ──────────────────────────────────────────────────────────────

interface ModalState {
  clientId: string;
  initialDate?: string;
  post?: ContentPost;
}

interface Props {
  clients: Client[];
  posts: ContentPost[];
  selectedClientId?: string;
  year: number;
  month: number;
}

export function CalendarView({ clients, posts, selectedClientId, year, month }: Props) {
  const router = useRouter();
  const [modal, setModal] = useState<ModalState | null>(null);

  // ── Navigation ──────────────────────────────────────────────────────────

  function navigate(params: Record<string, string>) {
    const sp = new URLSearchParams();
    if (selectedClientId) sp.set("client", selectedClientId);
    sp.set("year", String(year));
    sp.set("month", String(month));
    Object.entries(params).forEach(([k, v]) => sp.set(k, v));
    router.push(`/dashboard/content-calendar?${sp.toString()}`);
  }

  function handleClientChange(clientId: string) {
    const sp = new URLSearchParams();
    if (clientId) sp.set("client", clientId);
    // reset to current calendar month when changing clients
    const now = new Date();
    sp.set("year", String(now.getFullYear()));
    sp.set("month", String(now.getMonth() + 1));
    router.push(`/dashboard/content-calendar?${sp.toString()}`);
  }

  function prevMonth() {
    if (month === 1) navigate({ year: String(year - 1), month: "12" });
    else navigate({ month: String(month - 1) });
  }

  function nextMonth() {
    if (month === 12) navigate({ year: String(year + 1), month: "1" });
    else navigate({ month: String(month + 1) });
  }

  function goToday() {
    const now = new Date();
    navigate({ year: String(now.getFullYear()), month: String(now.getMonth() + 1) });
  }

  // ── Post map keyed by YYYY-MM-DD ─────────────────────────────────────────

  const postsByDate: Record<string, ContentPost[]> = {};
  for (const post of posts) {
    const d = new Date(post.scheduled_at);
    const key = toDateKey(d.getFullYear(), d.getMonth() + 1, d.getDate());
    if (!postsByDate[key]) postsByDate[key] = [];
    postsByDate[key].push(post);
  }

  // ── Today ──────────────────────────────────────────────────────────────

  const today = new Date();
  const todayKey = toDateKey(today.getFullYear(), today.getMonth() + 1, today.getDate());

  // ── Calendar grid ──────────────────────────────────────────────────────

  const weeks = buildCalendarGrid(year, month);

  const openCreate = useCallback(
    (dateKey: string) => {
      if (!selectedClientId) return;
      setModal({ clientId: selectedClientId, initialDate: dateKey });
    },
    [selectedClientId]
  );

  const openEdit = useCallback(
    (post: ContentPost) => {
      if (!selectedClientId) return;
      setModal({ clientId: selectedClientId, post });
    },
    [selectedClientId]
  );

  const closeModal = useCallback(() => setModal(null), []);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-medium">Content Calendar</h1>
        {selectedClientId && (
          <button
            onClick={() => openCreate(toDateKey(year, month, today.getDate()))}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New post
          </button>
        )}
      </div>

      {/* Client selector */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
        <label className="mb-1.5 block text-sm text-zinc-400">Client</label>
        {clients.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No active clients have the &quot;Content Calendar &amp; Posting&quot; service yet.
          </p>
        ) : (
          <select
            value={selectedClientId ?? ""}
            onChange={(e) => handleClientChange(e.target.value)}
            className="w-full max-w-sm rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">— Select a client —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Calendar */}
      {selectedClientId && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 overflow-hidden">
          {/* Month nav */}
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
            <div className="flex items-center gap-2">
              <button
                onClick={prevMonth}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white"
                aria-label="Previous month"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              <span className="text-sm font-medium text-white w-36 text-center">
                {MONTH_NAMES[month - 1]} {year}
              </span>
              <button
                onClick={nextMonth}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white"
                aria-label="Next month"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
            <button
              onClick={goToday}
              className="rounded-lg border border-zinc-600 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800"
            >
              Today
            </button>
          </div>

          {/* Day-of-week header */}
          <div className="grid grid-cols-7 border-b border-zinc-800">
            {DAY_NAMES.map((d) => (
              <div
                key={d}
                className="py-2 text-center text-xs font-medium text-zinc-500 uppercase tracking-wide"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Weeks */}
          <div className="divide-y divide-zinc-800">
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 divide-x divide-zinc-800">
                {week.map((day, di) => {
                  if (day === null) {
                    return <div key={di} className="min-h-[100px] bg-zinc-950/30 p-2" />;
                  }
                  const dateKey = toDateKey(year, month, day);
                  const dayPosts = postsByDate[dateKey] ?? [];
                  const isToday = dateKey === todayKey;

                  return (
                    <div
                      key={di}
                      onClick={() => openCreate(dateKey)}
                      className="min-h-[100px] p-2 cursor-pointer hover:bg-zinc-800/30 transition-colors"
                    >
                      {/* Day number */}
                      <div className="mb-1.5 flex items-center justify-between">
                        <span
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                            isToday
                              ? "bg-blue-600 text-white"
                              : "text-zinc-400"
                          }`}
                        >
                          {day}
                        </span>
                        {dayPosts.length > 2 && (
                          <span className="text-[10px] text-zinc-500">{dayPosts.length}</span>
                        )}
                      </div>

                      {/* Post chips — show up to 3 */}
                      <div className="space-y-1">
                        {dayPosts.slice(0, 3).map((post) => (
                          <button
                            key={post.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(post);
                            }}
                            className={`flex w-full items-center gap-1.5 rounded border px-1.5 py-0.5 text-left text-[11px] leading-tight truncate ${PLATFORM_COLORS[post.platform]}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${STATUS_DOT[post.status]}`}
                            />
                            <span className="font-medium">{PLATFORM_LABELS[post.platform]}</span>
                            <span className="truncate opacity-75">
                              {post.caption || "No caption"}
                            </span>
                          </button>
                        ))}
                        {dayPosts.length > 3 && (
                          <p className="pl-1 text-[10px] text-zinc-500">
                            +{dayPosts.length - 3} more
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      {selectedClientId && (
        <div className="flex flex-wrap gap-4 text-xs text-zinc-400">
          <span className="font-medium">Platforms:</span>
          {(Object.keys(PLATFORM_COLORS) as PostPlatform[]).map((p) => (
            <span key={p} className={`rounded border px-1.5 py-0.5 ${PLATFORM_COLORS[p]}`}>
              {PLATFORM_LABELS[p]}
            </span>
          ))}
          <span className="ml-4 font-medium">Status:</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-zinc-400" /> Draft</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-yellow-400" /> Scheduled</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-400" /> Published</span>
        </div>
      )}

      {/* Post modal */}
      {modal && (
        <PostModal
          clientId={modal.clientId}
          initialDate={modal.initialDate}
          post={modal.post}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
