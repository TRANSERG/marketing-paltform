"use server";

import { createClient } from "@/lib/supabase/server";
import type { WorkingHoursDay } from "@/types/database";

const DAYS: WorkingHoursDay["day"][] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export async function upsertProfileAction(
  clientId: string,
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string } | undefined> {
  const supabase = await createClient();

  // ── clients table fields ────────────────────────────────────────────────
  const website          = (formData.get("website") as string)?.trim() || null;
  const business_category = (formData.get("business_category") as string)?.trim() || null;
  const tagline          = (formData.get("tagline") as string)?.trim() || null;

  const { error: clientError } = await supabase
    .from("clients")
    .update({ website, business_category, tagline, updated_at: new Date().toISOString() })
    .eq("id", clientId);
  if (clientError) return { error: clientError.message };

  // ── client_profile fields ────────────────────────────────────────────────
  const description       = (formData.get("description") as string)?.trim() || null;
  const founded_year_raw  = formData.get("founded_year") as string;
  const founded_year      = founded_year_raw ? parseInt(founded_year_raw) : null;
  const team_size         = (formData.get("team_size") as string) || null;
  const price_range       = (formData.get("price_range") as string) || null;
  const target_audience   = (formData.get("target_audience") as string)?.trim() || null;

  // structured address
  const street_address = (formData.get("street_address") as string)?.trim() || null;
  const city           = (formData.get("city") as string)?.trim() || null;
  const state          = (formData.get("state") as string)?.trim() || null;
  const postal_code    = (formData.get("postal_code") as string)?.trim() || null;
  const country        = (formData.get("country") as string)?.trim() || null;

  // social & online
  const instagram_handle    = (formData.get("instagram_handle") as string)?.trim().replace(/^@/, "") || null;
  const facebook_handle     = (formData.get("facebook_handle") as string)?.trim() || null;
  const tiktok_handle       = (formData.get("tiktok_handle") as string)?.trim().replace(/^@/, "") || null;
  const youtube_handle      = (formData.get("youtube_handle") as string)?.trim() || null;
  const google_business_url = (formData.get("google_business_url") as string)?.trim() || null;
  const booking_link        = (formData.get("booking_link") as string)?.trim() || null;
  const order_link          = (formData.get("order_link") as string)?.trim() || null;

  // arrays from comma-separated or checkboxes
  const parseArray = (key: string): string[] | null => {
    const val = (formData.get(key) as string)?.trim();
    if (!val) return null;
    const arr = val.split(",").map((s) => s.trim()).filter(Boolean);
    return arr.length ? arr : null;
  };
  const parseCheckboxArray = (key: string): string[] | null => {
    const vals = formData.getAll(key) as string[];
    return vals.length ? vals : null;
  };

  const delivery_platforms  = parseCheckboxArray("delivery_platforms");
  const payment_methods     = parseCheckboxArray("payment_methods");
  const amenities           = parseCheckboxArray("amenities");
  const languages_spoken    = parseArray("languages_spoken");
  const unique_selling_points = (formData.get("unique_selling_points") as string)
    ?.split("\n").map((s) => s.trim()).filter(Boolean) ?? null;

  // working hours
  const working_hours: WorkingHoursDay[] = DAYS.map((day) => ({
    day,
    closed: formData.get(`hours_${day}_closed`) === "on",
    open:   (formData.get(`hours_${day}_open`) as string) || "09:00",
    close:  (formData.get(`hours_${day}_close`) as string) || "18:00",
  }));

  const { error: profileError } = await supabase
    .from("client_profile")
    .upsert(
      {
        client_id: clientId,
        description,
        founded_year,
        team_size: team_size || null,
        price_range: price_range || null,
        target_audience,
        street_address,
        city,
        state,
        postal_code,
        country,
        instagram_handle,
        facebook_handle,
        tiktok_handle,
        youtube_handle,
        google_business_url,
        booking_link,
        order_link,
        delivery_platforms,
        payment_methods,
        amenities,
        languages_spoken,
        unique_selling_points,
        working_hours,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "client_id" }
    );
  if (profileError) return { error: profileError.message };
}
