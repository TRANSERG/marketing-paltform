import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { hasPermission } from "@/types/auth";
import { ClientForm } from "../ClientForm";
import type { ClientStatus } from "@/types/database";

export default async function NewClientPage() {
  const user = await getAuthUser();
  if (!user || (!hasPermission(user, "clients.create") && !hasPermission(user, "users.manage"))) {
    redirect("/dashboard/clients");
  }

  async function createClientAction(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return { error: "Not authenticated" };
    const name = formData.get("name") as string;
    const contact_email = (formData.get("contact_email") as string) || null;
    const contact_phone = (formData.get("contact_phone") as string) || null;
    const address = (formData.get("address") as string) || null;
    const timezone = (formData.get("timezone") as string) || "UTC";
    const status = (formData.get("status") as ClientStatus) || "lead";
    if (!name?.trim()) return { error: "Name is required" };
    const { data, error } = await supabase
      .from("clients")
      .insert({
        name: name.trim(),
        contact_email: contact_email?.trim() || null,
        contact_phone: contact_phone?.trim() || null,
        address: address?.trim() || null,
        timezone: timezone?.trim() || "UTC",
        status,
        created_by: authUser.id,
      })
      .select("id")
      .single();
    if (error) return { error: error.message };
    redirect(`/dashboard/clients/${data.id}`);
  }

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/clients"
        className="text-sm text-zinc-400 hover:text-white min-h-[44px] inline-flex items-center"
      >
        ← Clients
      </Link>
      <h2 className="text-lg font-medium">New client</h2>
      <ClientForm action={createClientAction} />
    </div>
  );
}
