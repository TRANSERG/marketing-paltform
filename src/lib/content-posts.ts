import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Client, ContentPost } from "@/types/database";

/**
 * Returns active clients that have the "Content Calendar & Posting" service
 * in a non-paused/non-completed state, ordered by client name.
 */
export const getClientsWithContentCalendar = cache(
  async (): Promise<Client[]> => {
    const supabase = await createClient();

    // Step 1: find the service id
    const { data: service, error: serviceError } = await supabase
      .from("services")
      .select("id")
      .eq("name", "Content Calendar & Posting")
      .single();

    if (serviceError || !service) return [];

    // Step 2: find client ids that have this service active/onboarding
    const { data: clientServices, error: csError } = await supabase
      .from("client_services")
      .select("client_id")
      .eq("service_id", service.id)
      .not("status", "in", "(paused,completed)");

    if (csError || !clientServices || clientServices.length === 0) return [];

    const clientIds = [...new Set(clientServices.map((r) => r.client_id as string))];

    // Step 3: fetch active clients from that list
    const { data, error } = await supabase
      .from("clients")
      .select(
        "id, name, contact_email, contact_phone, address, timezone, status, created_by, assigned_ops_id, sold_at, activated_at, created_at, updated_at"
      )
      .eq("status", "active")
      .in("id", clientIds)
      .order("name", { ascending: true });

    if (error) throw error;
    return (data ?? []) as Client[];
  }
);

/**
 * Returns all content posts for a given client within a calendar month.
 * month is 1-based (1 = January, 12 = December).
 */
export async function getContentPosts(
  clientId: string,
  year: number,
  month: number
): Promise<ContentPost[]> {
  const supabase = await createClient();

  const start = new Date(Date.UTC(year, month - 1, 1)).toISOString();
  const end = new Date(Date.UTC(year, month, 1)).toISOString();

  const { data, error } = await supabase
    .from("content_posts")
    .select("*")
    .eq("client_id", clientId)
    .gte("scheduled_at", start)
    .lt("scheduled_at", end)
    .order("scheduled_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as ContentPost[];
}
