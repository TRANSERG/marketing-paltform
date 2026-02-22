import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { hasPermission } from "@/types/auth";
import { NewServiceForm } from "../NewServiceForm";

export default async function NewServicePage() {
  const user = await getAuthUser();
  if (
    !hasPermission(user, "services.create") &&
    !hasPermission(user, "users.manage")
  ) {
    redirect("/dashboard/services");
  }

  async function createServiceAction(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) return { error: "Not authenticated" };
    const name = (formData.get("name") as string)?.trim();
    const description = (formData.get("description") as string)?.trim() || null;
    if (!name) return { error: "Name is required" };
    const { data, error } = await supabase
      .from("services")
      .insert({ name, description })
      .select("id")
      .single();
    if (error) return { error: error.message };
    redirect(`/dashboard/services/${data.id}/edit`);
  }

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/services"
        className="text-sm text-zinc-400 hover:text-white min-h-[44px] inline-flex items-center"
      >
        ← Services
      </Link>
      <h2 className="text-lg font-medium">New service</h2>
      <NewServiceForm action={createServiceAction} />
    </div>
  );
}
