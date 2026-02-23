"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AuthUser } from "@/types/auth";
import { hasPermission, isAdmin } from "@/types/auth";

const navClass = "block px-3 py-2.5 rounded-lg text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white min-h-[44px] flex items-center";
const activeClass = "bg-zinc-800 text-white";

export function DashboardNav({ user }: { user: AuthUser }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      <Link
        href="/dashboard"
        className={pathname === "/dashboard" ? `${navClass} ${activeClass}` : navClass}
      >
        Dashboard
      </Link>
      {(hasPermission(user, "clients.read") || isAdmin(user)) && (
        <Link
          href="/dashboard/clients"
          className={pathname?.startsWith("/dashboard/clients") && !pathname?.startsWith("/dashboard/my-clients") ? `${navClass} ${activeClass}` : navClass}
        >
          Clients
        </Link>
      )}
      {hasPermission(user, "client_services.update_stage") && (
        <Link
          href="/dashboard/my-clients"
          className={pathname === "/dashboard/my-clients" ? `${navClass} ${activeClass}` : navClass}
        >
          My clients
        </Link>
      )}
      {(hasPermission(user, "services.update") || hasPermission(user, "task_templates.read") || isAdmin(user)) && (
        <Link
          href="/dashboard/services"
          className={pathname?.startsWith("/dashboard/services") ? `${navClass} ${activeClass}` : navClass}
        >
          Services
        </Link>
      )}
      {(hasPermission(user, "client_services.update_stage") || hasPermission(user, "clients.read") || isAdmin(user)) && (
        <Link
          href="/dashboard/tasks"
          className={pathname?.startsWith("/dashboard/tasks") ? `${navClass} ${activeClass}` : navClass}
        >
          Tasks
        </Link>
      )}
      {isAdmin(user) && (
        <>
          <Link
            href="/dashboard/settings"
            className={pathname?.startsWith("/dashboard/settings") ? `${navClass} ${activeClass}` : navClass}
          >
            Settings
          </Link>
          <Link
            href="/dashboard/roles"
            className={pathname?.startsWith("/dashboard/roles") ? `${navClass} ${activeClass}` : navClass}
          >
            Roles
          </Link>
          <Link
            href="/dashboard/users"
            className={pathname?.startsWith("/dashboard/users") ? `${navClass} ${activeClass}` : navClass}
          >
            Users
          </Link>
        </>
      )}
    </nav>
  );
}
