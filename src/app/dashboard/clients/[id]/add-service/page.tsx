import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { getClientById } from "@/lib/clients";
import { getServicesWithStages } from "@/lib/services";
import { createTasksForClientService } from "@/lib/tasks";
import { hasPermission } from "@/types/auth";
import { AddServiceForm } from "../../AddServiceForm";

export default async function AddServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getAuthUser();
  const { client, clientServices } = await getClientById(id);
  if (!client) notFound();
  const canUpdate =
    hasPermission(user, "clients.update") || hasPermission(user, "users.manage");
  if (!canUpdate) notFound();

  const servicesWithStages = await getServicesWithStages();
  const existingServiceIds = new Set(clientServices.map((cs) => cs.service_id));
  const availableServices = servicesWithStages.filter(
    (s) => !existingServiceIds.has(s.id)
  );

  async function addServiceAction(formData: FormData) {
    "use server";
    const serviceId = formData.get("service_id") as string;
    if (!serviceId) return { error: "Select a service" };
    const supabase = await createClient();
    const { data: clientRow } = await supabase
      .from("clients")
      .select("assigned_ops_id")
      .eq("id", id)
      .single();
    const assigneeId = (clientRow as { assigned_ops_id: string | null } | null)?.assigned_ops_id ?? null;
    const { data: cs, error: insertError } = await supabase
      .from("client_services")
      .insert({ client_id: id, service_id: serviceId, status: "pending" })
      .select("id")
      .single();
    if (insertError) return { error: insertError.message };
    const { data: firstStage } = await supabase
      .from("service_stages")
      .select("id")
      .eq("service_id", serviceId)
      .order("sort_order", { ascending: true })
      .limit(1)
      .single();
    if (firstStage?.id && cs?.id) {
      await supabase.from("client_service_stages").insert({
        client_service_id: cs.id,
        service_stage_id: firstStage.id,
      });
    }
    if (cs?.id) {
      await createTasksForClientService(cs.id, serviceId, assigneeId);
    }
    redirect(`/dashboard/clients/${id}`);
  }

  return (
    <div className="space-y-6">
      <Link
        href={`/dashboard/clients/${id}`}
        className="text-sm text-zinc-400 hover:text-white min-h-[44px] inline-flex items-center"
      >
        ← Back to client
      </Link>
      <h2 className="text-lg font-medium">Add service</h2>
      {availableServices.length === 0 ? (
        <p className="text-zinc-400">
          All services are already added for this client.
        </p>
      ) : (
        <AddServiceForm
          action={addServiceAction}
          services={availableServices}
          clientId={id}
        />
      )}
    </div>
  );
}
