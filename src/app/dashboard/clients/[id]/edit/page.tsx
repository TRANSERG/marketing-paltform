import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { getClientById } from "@/lib/clients";
import { hasPermission } from "@/types/auth";
import { ClientForm } from "../../ClientForm";
import type { ClientStatus } from "@/types/database";

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getAuthUser();
  const { client } = await getClientById(id);
  if (!client) notFound();
  const canUpdate =
    hasPermission(user, "clients.update") || hasPermission(user, "users.manage");
  if (!canUpdate) notFound();

  async function updateClientAction(formData: FormData) {
    "use server";
    const name = formData.get("name") as string;
    const contact_email = (formData.get("contact_email") as string) || null;
    const contact_phone = (formData.get("contact_phone") as string) || null;
    const address = (formData.get("address") as string) || null;
    const timezone = (formData.get("timezone") as string) || "UTC";
    const status = (formData.get("status") as ClientStatus) || client!.status;
    if (!name?.trim()) return { error: "Name is required" };
    const supabase = await createClient();
    const updates: Record<string, unknown> = {
      name: name.trim(),
      contact_email: contact_email?.trim() || null,
      contact_phone: contact_phone?.trim() || null,
      address: address?.trim() || null,
      timezone: timezone?.trim() || "UTC",
      status,
      updated_at: new Date().toISOString(),
    };
    if (status === "closed" && client!.status !== "closed") {
      updates.sold_at = new Date().toISOString();
    }
    const { error } = await supabase
      .from("clients")
      .update(updates)
      .eq("id", id);
    if (error) return { error: error.message };
    redirect(`/dashboard/clients/${id}`);
  }

  return (
    <div className="space-y-6">
      <Link
        href={`/dashboard/clients/${id}`}
        className="text-sm text-zinc-400 hover:text-white"
      >
        ← Back to client
      </Link>
      <h2 className="text-lg font-medium">Edit client</h2>
      <ClientForm action={updateClientAction} client={client} />
    </div>
  );
}
