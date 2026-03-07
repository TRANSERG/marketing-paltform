"use server";

import { createClient } from "@/lib/supabase/server";

export async function upsertBrandAction(
  clientId: string,
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string } | undefined> {
  const supabase = await createClient();

  const logo_path       = (formData.get("logo_path") as string)?.trim() || null;
  const primary_color   = (formData.get("primary_color") as string) || null;
  const secondary_color = (formData.get("secondary_color") as string) || null;
  const accent_color    = (formData.get("accent_color") as string) || null;
  const background_color = (formData.get("background_color") as string) || null;
  const heading_font    = (formData.get("heading_font") as string)?.trim() || null;
  const body_font       = (formData.get("body_font") as string)?.trim() || null;
  const brand_tone      = (formData.get("brand_tone") as string) || null;
  const style_notes     = (formData.get("style_notes") as string)?.trim() || null;

  const content_themes = (formData.getAll("content_themes") as string[]) || null;
  const hashtags_raw   = (formData.get("hashtags") as string)?.trim();
  const hashtags = hashtags_raw
    ? hashtags_raw.split(/[\s,]+/).map((h) => (h.startsWith("#") ? h : `#${h}`)).filter(Boolean)
    : null;

  const { error } = await supabase
    .from("client_brand")
    .upsert(
      {
        client_id: clientId,
        logo_path,
        primary_color,
        secondary_color,
        accent_color,
        background_color,
        heading_font,
        body_font,
        brand_tone: brand_tone || null,
        style_notes,
        content_themes: content_themes.length ? content_themes : null,
        hashtags,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "client_id" }
    );
  if (error) return { error: error.message };
}
