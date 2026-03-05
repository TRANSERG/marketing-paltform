import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { hasPermission, isAdmin } from "@/types/auth";
import { getClientsWithContentCalendar, getContentPosts } from "@/lib/content-posts";
import { CalendarView } from "./CalendarView";

export default async function ContentCalendarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getAuthUser();
  if (!user || (!hasPermission(user, "clients.read") && !isAdmin(user))) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const clientId = typeof params.client === "string" ? params.client : undefined;

  const now = new Date();
  const year = parseInt(typeof params.year === "string" ? params.year : String(now.getFullYear()), 10);
  const month = parseInt(typeof params.month === "string" ? params.month : String(now.getMonth() + 1), 10);

  const safeYear = Number.isFinite(year) ? year : now.getFullYear();
  const safeMonth = Number.isFinite(month) && month >= 1 && month <= 12 ? month : now.getMonth() + 1;

  const [clients, posts] = await Promise.all([
    getClientsWithContentCalendar(),
    clientId ? getContentPosts(clientId, safeYear, safeMonth) : Promise.resolve([]),
  ]);

  return (
    <CalendarView
      clients={clients}
      posts={posts}
      selectedClientId={clientId}
      year={safeYear}
      month={safeMonth}
    />
  );
}
