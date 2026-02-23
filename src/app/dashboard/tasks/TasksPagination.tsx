"use client";

import Link from "next/link";

const PAGE_SIZES = [10, 25, 50] as const;

interface TasksPaginationProps {
  page: number;
  pageSize: number;
  totalCount: number;
  currentParams: Record<string, string | string[] | undefined>;
}

function buildQuery(
  current: Record<string, string | string[] | undefined>,
  overrides: Record<string, string>
): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(current)) {
    if (v === undefined || (Array.isArray(v) && v.length === 0)) continue;
    const val = Array.isArray(v) ? v[0] : v;
    if (val) p.set(k, val);
  }
  for (const [k, v] of Object.entries(overrides)) {
    p.set(k, v);
  }
  const q = p.toString();
  return q ? `?${q}` : "";
}

export function TasksPagination({
  page,
  pageSize,
  totalCount,
  currentParams,
}: TasksPaginationProps) {
  const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  const base = "/dashboard/tasks";

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <p className="text-sm text-zinc-400">
        Showing {from}–{to} of {totalCount}
      </p>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-500">Per page</span>
          <select
            className="rounded-lg border border-zinc-600 bg-zinc-800 px-2 py-1.5 text-sm text-white"
            value={pageSize}
            onChange={(e) => {
              const next = e.target.value;
              const params = { ...currentParams, pageSize: next, page: "1" };
              const q = buildQuery(params, { pageSize: next, page: "1" });
              window.location.href = `${base}${q}`;
            }}
          >
            {PAGE_SIZES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={hasPrev ? `${base}${buildQuery(currentParams, { page: String(page - 1) })}` : "#"}
            aria-disabled={!hasPrev}
            className={`rounded-lg border px-3 py-1.5 text-sm ${
              hasPrev
                ? "border-zinc-600 text-zinc-300 hover:bg-zinc-800"
                : "border-zinc-700 text-zinc-500 cursor-not-allowed"
            }`}
          >
            Previous
          </Link>
          <span className="text-sm text-zinc-400">
            Page {page} of {totalPages}
          </span>
          <Link
            href={hasNext ? `${base}${buildQuery(currentParams, { page: String(page + 1) })}` : "#"}
            aria-disabled={!hasNext}
            className={`rounded-lg border px-3 py-1.5 text-sm ${
              hasNext
                ? "border-zinc-600 text-zinc-300 hover:bg-zinc-800"
                : "border-zinc-700 text-zinc-500 cursor-not-allowed"
            }`}
          >
            Next
          </Link>
        </div>
      </div>
    </div>
  );
}
