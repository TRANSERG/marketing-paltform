import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { DashboardNav } from "./DashboardNav";

export default async function DashboardLayout({
  children,
}: { children: React.ReactNode }) {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <h1 className="font-semibold">Marketing Platform</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-400">
            {user.user_role ?? "—"} {user.email && `· ${user.email}`}
          </span>
          <form action="/api/auth/signout" method="post">
            <button
              type="submit"
              className="text-sm text-zinc-500 hover:text-white"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>
      <div className="flex flex-1">
        <aside className="w-56 border-r border-zinc-800 p-4">
          <DashboardNav user={user} />
        </aside>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
