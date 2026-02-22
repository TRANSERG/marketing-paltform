"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { DashboardNav } from "./DashboardNav";
import type { AuthUser } from "@/types/auth";

export function DashboardShell({
  user,
  children,
}: {
  user: AuthUser;
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="md:relative fixed top-0 left-0 right-0 z-50 border-b border-zinc-800 px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between gap-2 flex-shrink-0 bg-zinc-950">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white shrink-0"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
          <h1 className="font-semibold truncate">Marketing Platform</h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 shrink-0">
          <span className="text-sm text-zinc-400 truncate max-w-[100px] sm:max-w-none" title={user.email ?? undefined}>
            {user.user_role ?? "—"}
            {user.email && <span className="hidden sm:inline"> · {user.email}</span>}
          </span>
          <form action="/api/auth/signout" method="post">
            <button
              type="submit"
              className="text-sm text-zinc-500 hover:text-white py-2 px-2 sm:px-3 rounded-lg hover:bg-zinc-800 min-h-[44px] min-w-[44px] sm:min-w-0 flex items-center justify-center"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 relative pt-14 md:pt-0">
        {/* Mobile overlay backdrop */}
        {menuOpen && (
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm top-14"
            aria-label="Close menu"
          />
        )}

        {/* Sidebar: drawer on mobile, column on desktop */}
        <aside
          className={`
            fixed md:static top-14 md:top-0 bottom-0 left-0 z-40 w-64 md:w-56
            bg-zinc-950 border-r border-zinc-800 p-4
            transform transition-transform duration-200 ease-out
            md:transform-none md:flex-shrink-0
            ${menuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          `}
        >
          <DashboardNav user={user} />
        </aside>

        <main className="flex-1 min-w-0 p-4 sm:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
