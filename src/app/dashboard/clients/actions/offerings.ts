"use server";

import { createClient } from "@/lib/supabase/server";
import type { OfferingType } from "@/types/database";

export async function createOfferingAction(
  clientId: string,
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string } | undefined> {
  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Name is required" };

  const supabase = await createClient();
  const { error } = await supabase.from("client_offerings").insert({
    client_id:        clientId,
    offering_type:    (formData.get("offering_type") as OfferingType) || "service",
    category:         (formData.get("category") as string)?.trim() || null,
    name,
    description:      (formData.get("description") as string)?.trim() || null,
    price:            formData.get("price") ? parseFloat(formData.get("price") as string) : null,
    currency:         (formData.get("currency") as string) || "INR",
    duration_minutes: formData.get("duration_minutes") ? parseInt(formData.get("duration_minutes") as string) : null,
    is_available:     formData.get("is_available") !== "false",
    is_featured:      formData.get("is_featured") === "true",
    tags:             (formData.get("tags") as string)?.split(",").map((t) => t.trim()).filter(Boolean) || null,
    sort_order:       formData.get("sort_order") ? parseInt(formData.get("sort_order") as string) : 0,
  });
  if (error) return { error: error.message };
}

export async function updateOfferingAction(
  id: string,
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string } | undefined> {
  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Name is required" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("client_offerings")
    .update({
      offering_type:    (formData.get("offering_type") as OfferingType) || "service",
      category:         (formData.get("category") as string)?.trim() || null,
      name,
      description:      (formData.get("description") as string)?.trim() || null,
      price:            formData.get("price") ? parseFloat(formData.get("price") as string) : null,
      currency:         (formData.get("currency") as string) || "INR",
      duration_minutes: formData.get("duration_minutes") ? parseInt(formData.get("duration_minutes") as string) : null,
      is_available:     formData.get("is_available") !== "false",
      is_featured:      formData.get("is_featured") === "true",
      tags:             (formData.get("tags") as string)?.split(",").map((t) => t.trim()).filter(Boolean) || null,
      updated_at:       new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { error: error.message };
}

export async function deleteOfferingAction(id: string): Promise<{ error?: string } | undefined> {
  const supabase = await createClient();
  const { error } = await supabase.from("client_offerings").delete().eq("id", id);
  if (error) return { error: error.message };
}
