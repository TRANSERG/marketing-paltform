"use client";

import { useActionState } from "react";
import { Spinner } from "@/components/Spinner";
import type { ClientBrand } from "@/types/database";
import type { upsertBrandAction } from "./actions/brand";

const TONE_OPTIONS = [
  { value: "professional", label: "Professional — clean, formal, trustworthy" },
  { value: "friendly",     label: "Friendly — warm, approachable, conversational" },
  { value: "playful",      label: "Playful — fun, energetic, youthful" },
  { value: "bold",         label: "Bold — confident, direct, powerful" },
  { value: "luxurious",    label: "Luxurious — elegant, premium, sophisticated" },
  { value: "earthy",       label: "Earthy — organic, natural, sustainable" },
  { value: "minimalist",   label: "Minimalist — clean, simple, understated" },
  { value: "edgy",         label: "Edgy — rebellious, unconventional, creative" },
];

const CONTENT_THEMES = [
  { value: "behind-the-scenes", label: "Behind the scenes" },
  { value: "product-showcase",  label: "Product / service showcase" },
  { value: "testimonials",      label: "Customer testimonials" },
  { value: "educational",       label: "Educational / tips & tricks" },
  { value: "promotions",        label: "Offers & promotions" },
  { value: "seasonal",          label: "Seasonal & events" },
  { value: "team-spotlight",    label: "Team spotlight" },
  { value: "before-after",      label: "Before & after" },
  { value: "ugc",               label: "User-generated content (reposts)" },
];

const POPULAR_FONTS = [
  "Inter", "Roboto", "Open Sans", "Lato", "Montserrat",
  "Playfair Display", "Merriweather", "Source Serif Pro",
  "Oswald", "Raleway", "Poppins", "Nunito", "DM Sans", "Plus Jakarta Sans",
];

const inputCls =
  "w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base";
const labelCls = "mb-1 block text-sm text-zinc-400";
const sectionCls = "space-y-4 pt-6 first:pt-0";
const headingCls = "text-sm font-medium text-zinc-200 border-b border-zinc-800 pb-2 mb-4";

type Action = typeof upsertBrandAction;

interface BrandFormProps {
  brand: ClientBrand | null;
  action: (
    prev: { error?: string } | undefined,
    formData: FormData
  ) => ReturnType<Action>;
}

export function BrandForm({ brand, action }: BrandFormProps) {
  const [state, formAction, isPending] = useActionState(action, undefined);

  const chkTheme = (val: string) =>
    Array.isArray(brand?.content_themes) && brand.content_themes.includes(val);

  return (
    <form action={formAction} className="space-y-8">

      {/* ── Colors ──────────────────────────────────────────────────────── */}
      <div className={sectionCls}>
        <h3 className={headingCls}>Brand Colors</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              ["primary_color",    "Primary color"],
              ["secondary_color",  "Secondary color"],
              ["accent_color",     "Accent color"],
              ["background_color", "Background color"],
            ] as [string, string][]
          ).map(([name, label]) => {
            const current = (brand as Record<string, unknown> | null)?.[name] as string | null ?? "#ffffff";
            return (
              <div key={name}>
                <label htmlFor={name} className={labelCls}>{label}</label>
                <div className="flex items-center gap-3">
                  <input id={name} name={name} type="color" defaultValue={current} className="h-10 w-16 cursor-pointer rounded border border-zinc-700 bg-zinc-900 p-1" />
                  <span className="font-mono text-sm text-zinc-400">{current}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Typography ──────────────────────────────────────────────────── */}
      <div className={sectionCls}>
        <h3 className={headingCls}>Typography</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="heading_font" className={labelCls}>Heading font</label>
            <input
              list="font-list"
              id="heading_font"
              name="heading_font"
              defaultValue={brand?.heading_font ?? ""}
              className={inputCls}
              placeholder="Playfair Display"
            />
          </div>
          <div>
            <label htmlFor="body_font" className={labelCls}>Body font</label>
            <input
              list="font-list"
              id="body_font"
              name="body_font"
              defaultValue={brand?.body_font ?? ""}
              className={inputCls}
              placeholder="Inter"
            />
          </div>
        </div>
        <datalist id="font-list">
          {POPULAR_FONTS.map((f) => <option key={f} value={f} />)}
        </datalist>
        <p className="text-xs text-zinc-500">Type any Google Font name or choose from the suggestions.</p>
      </div>

      {/* ── Brand Voice & Tone ──────────────────────────────────────────── */}
      <div className={sectionCls}>
        <h3 className={headingCls}>Voice &amp; Tone</h3>
        <div>
          <label htmlFor="brand_tone" className={labelCls}>Brand tone</label>
          <select id="brand_tone" name="brand_tone" defaultValue={brand?.brand_tone ?? ""} className={inputCls}>
            <option value="">Select tone</option>
            {TONE_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="style_notes" className={labelCls}>Style guidelines & voice notes</label>
          <textarea
            id="style_notes"
            name="style_notes"
            rows={4}
            defaultValue={brand?.style_notes ?? ""}
            className={inputCls}
            placeholder={"Always use 'you' and 'we' — never formal third person.\nAvoid technical jargon.\nEmojis are encouraged but max 2 per post."}
          />
        </div>
      </div>

      {/* ── Content Strategy ────────────────────────────────────────────── */}
      <div className={sectionCls}>
        <h3 className={headingCls}>Content Strategy</h3>
        <div>
          <p className={labelCls}>Content themes <span className="text-zinc-500">(select all that apply)</span></p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {CONTENT_THEMES.map(({ value, label }) => (
              <label key={value} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="content_themes" value={value} defaultChecked={chkTheme(value)} className="accent-blue-500" />
                <span className="text-sm text-zinc-300">{label}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="hashtags" className={labelCls}>Go-to hashtags <span className="text-zinc-500">(space or comma-separated, # optional)</span></label>
          <textarea
            id="hashtags"
            name="hashtags"
            rows={3}
            defaultValue={brand?.hashtags?.join(" ") ?? ""}
            className={inputCls}
            placeholder="#MumbaiCafe #SpecialtyCoffee #CoffeeLover"
          />
        </div>
      </div>

      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}

      <div className="flex flex-wrap gap-3 pb-4">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 min-h-[48px] inline-flex items-center gap-2"
        >
          {isPending ? (
            <><Spinner size="sm" className="shrink-0" />Saving…</>
          ) : (
            "Save brand"
          )}
        </button>
      </div>
    </form>
  );
}
