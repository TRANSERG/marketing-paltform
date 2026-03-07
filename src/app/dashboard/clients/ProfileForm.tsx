"use client";

import { useActionState } from "react";
import { Spinner } from "@/components/Spinner";
import { WorkingHoursEditor } from "./WorkingHoursEditor";
import type { Client, ClientProfile } from "@/types/database";
import type { upsertProfileAction } from "./actions/profile";

const BUSINESS_CATEGORIES = [
  "Cafe", "Restaurant", "Bar", "Bakery", "Food Truck", "Catering",
  "Hair Salon", "Barber Shop", "Nail Salon", "Spa", "Massage", "Beauty Studio",
  "Gym", "Yoga Studio", "Fitness Center", "Personal Trainer",
  "Retail Store", "Clothing", "Electronics", "Home Decor", "Gift Shop",
  "Dental Clinic", "Medical Clinic", "Pharmacy", "Optician",
  "Real Estate", "Law Firm", "Accounting", "Consulting",
  "Photography", "Event Venue",
  "Hotel", "Guest House",
  "Tutoring", "Driving School", "Language School",
  "Other",
];

const DELIVERY_PLATFORMS = [
  { value: "zomato", label: "Zomato" },
  { value: "swiggy", label: "Swiggy" },
  { value: "ubereats", label: "Uber Eats" },
  { value: "doordash", label: "DoorDash" },
  { value: "dunzo", label: "Dunzo" },
];

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Credit/Debit Card" },
  { value: "upi", label: "UPI" },
  { value: "netbanking", label: "Net Banking" },
  { value: "wallet", label: "Wallets (Paytm, PhonePe)" },
  { value: "crypto", label: "Crypto" },
];

const AMENITIES = [
  "Free WiFi", "Parking", "AC", "Outdoor Seating", "Wheelchair Accessible",
  "Restrooms", "Pet Friendly", "Kids Area", "Private Dining", "Valet Parking",
  "CCTV", "24/7 Security",
];

const inputCls =
  "w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base";
const labelCls = "mb-1 block text-sm text-zinc-400";
const sectionCls = "space-y-4 pt-6 first:pt-0";
const headingCls = "text-sm font-medium text-zinc-200 border-b border-zinc-800 pb-2 mb-4";

type Action = typeof upsertProfileAction;

interface ProfileFormProps {
  client: Client;
  profile: ClientProfile | null;
  action: (
    prev: { error?: string } | undefined,
    formData: FormData
  ) => ReturnType<Action>;
}

export function ProfileForm({ client, profile, action }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(action, undefined);

  const chk = (list: string[] | null, val: string) =>
    Array.isArray(list) && list.includes(val);

  return (
    <form action={formAction} className="space-y-8">

      {/* ── Basic Info ──────────────────────────────────────────────────── */}
      <div className={sectionCls}>
        <h3 className={headingCls}>Basic Info</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="business_category" className={labelCls}>Business category</label>
            <select id="business_category" name="business_category" defaultValue={client.business_category ?? ""} className={inputCls}>
              <option value="">Select category</option>
              {BUSINESS_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="website" className={labelCls}>Website</label>
            <input id="website" name="website" type="url" defaultValue={client.website ?? ""} className={inputCls} placeholder="https://yourbusiness.com" />
          </div>
        </div>
        <div>
          <label htmlFor="tagline" className={labelCls}>Tagline</label>
          <input id="tagline" name="tagline" type="text" defaultValue={client.tagline ?? ""} className={inputCls} placeholder="Best coffee in town" />
        </div>
        <div>
          <label htmlFor="description" className={labelCls}>About the business</label>
          <textarea id="description" name="description" rows={4} defaultValue={profile?.description ?? ""} className={inputCls} placeholder="Tell the story of this business..." />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="founded_year" className={labelCls}>Founded year</label>
            <input id="founded_year" name="founded_year" type="number" min="1900" max={new Date().getFullYear()} defaultValue={profile?.founded_year ?? ""} className={inputCls} placeholder="2019" />
          </div>
          <div>
            <label htmlFor="team_size" className={labelCls}>Team size</label>
            <select id="team_size" name="team_size" defaultValue={profile?.team_size ?? ""} className={inputCls}>
              <option value="">Select</option>
              <option value="solo">Solo</option>
              <option value="2-5">2–5</option>
              <option value="6-20">6–20</option>
              <option value="20+">20+</option>
            </select>
          </div>
          <div>
            <label htmlFor="price_range" className={labelCls}>Price range</label>
            <select id="price_range" name="price_range" defaultValue={profile?.price_range ?? ""} className={inputCls}>
              <option value="">Select</option>
              <option value="$">$ (Budget)</option>
              <option value="$$">$$ (Mid-range)</option>
              <option value="$$$">$$$ (Premium)</option>
              <option value="$$$$">$$$$ (Luxury)</option>
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="target_audience" className={labelCls}>Target audience</label>
          <input id="target_audience" name="target_audience" type="text" defaultValue={profile?.target_audience ?? ""} className={inputCls} placeholder="Young professionals, 25–40, Mumbai" />
        </div>
      </div>

      {/* ── Location ────────────────────────────────────────────────────── */}
      <div className={sectionCls}>
        <h3 className={headingCls}>Location</h3>
        <div>
          <label htmlFor="street_address" className={labelCls}>Street address</label>
          <input id="street_address" name="street_address" type="text" defaultValue={profile?.street_address ?? ""} className={inputCls} placeholder="12, MG Road" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="city" className={labelCls}>City</label>
            <input id="city" name="city" type="text" defaultValue={profile?.city ?? ""} className={inputCls} placeholder="Mumbai" />
          </div>
          <div>
            <label htmlFor="state" className={labelCls}>State</label>
            <input id="state" name="state" type="text" defaultValue={profile?.state ?? ""} className={inputCls} placeholder="Maharashtra" />
          </div>
          <div>
            <label htmlFor="postal_code" className={labelCls}>Postal code</label>
            <input id="postal_code" name="postal_code" type="text" defaultValue={profile?.postal_code ?? ""} className={inputCls} placeholder="400001" />
          </div>
          <div>
            <label htmlFor="country" className={labelCls}>Country</label>
            <input id="country" name="country" type="text" defaultValue={profile?.country ?? "India"} className={inputCls} placeholder="India" />
          </div>
        </div>
      </div>

      {/* ── Online Presence ──────────────────────────────────────────────── */}
      <div className={sectionCls}>
        <h3 className={headingCls}>Online Presence</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="instagram_handle" className={labelCls}>Instagram handle</label>
            <div className="flex">
              <span className="inline-flex items-center rounded-l-lg border border-r-0 border-zinc-700 bg-zinc-800 px-3 text-zinc-400 text-sm">@</span>
              <input id="instagram_handle" name="instagram_handle" type="text" defaultValue={profile?.instagram_handle ?? ""} className="flex-1 rounded-l-none rounded-r-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base" placeholder="yourbusiness" />
            </div>
          </div>
          <div>
            <label htmlFor="facebook_handle" className={labelCls}>Facebook page URL</label>
            <input id="facebook_handle" name="facebook_handle" type="text" defaultValue={profile?.facebook_handle ?? ""} className={inputCls} placeholder="facebook.com/yourbusiness" />
          </div>
          <div>
            <label htmlFor="tiktok_handle" className={labelCls}>TikTok handle</label>
            <div className="flex">
              <span className="inline-flex items-center rounded-l-lg border border-r-0 border-zinc-700 bg-zinc-800 px-3 text-zinc-400 text-sm">@</span>
              <input id="tiktok_handle" name="tiktok_handle" type="text" defaultValue={profile?.tiktok_handle ?? ""} className="flex-1 rounded-l-none rounded-r-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base" placeholder="yourbusiness" />
            </div>
          </div>
          <div>
            <label htmlFor="youtube_handle" className={labelCls}>YouTube channel URL</label>
            <input id="youtube_handle" name="youtube_handle" type="text" defaultValue={profile?.youtube_handle ?? ""} className={inputCls} placeholder="youtube.com/@yourbusiness" />
          </div>
          <div>
            <label htmlFor="google_business_url" className={labelCls}>Google Business Profile URL</label>
            <input id="google_business_url" name="google_business_url" type="url" defaultValue={profile?.google_business_url ?? ""} className={inputCls} placeholder="https://g.co/kgs/..." />
          </div>
          <div>
            <label htmlFor="booking_link" className={labelCls}>Booking link <span className="text-zinc-500">(Fresha, Booksy, etc.)</span></label>
            <input id="booking_link" name="booking_link" type="url" defaultValue={profile?.booking_link ?? ""} className={inputCls} placeholder="https://fresha.com/..." />
          </div>
          <div>
            <label htmlFor="order_link" className={labelCls}>Online order link <span className="text-zinc-500">(Zomato, Swiggy, etc.)</span></label>
            <input id="order_link" name="order_link" type="url" defaultValue={profile?.order_link ?? ""} className={inputCls} placeholder="https://zomato.com/..." />
          </div>
        </div>
      </div>

      {/* ── Operations ──────────────────────────────────────────────────── */}
      <div className={sectionCls}>
        <h3 className={headingCls}>Operations</h3>

        <div>
          <p className={labelCls}>Working hours</p>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
            <WorkingHoursEditor initialHours={profile?.working_hours} />
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className={labelCls}>Delivery platforms</p>
            <div className="space-y-2">
              {DELIVERY_PLATFORMS.map(({ value, label }) => (
                <label key={value} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="delivery_platforms" value={value} defaultChecked={chk(profile?.delivery_platforms ?? null, value)} className="accent-blue-500" />
                  <span className="text-sm text-zinc-300">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className={labelCls}>Payment methods</p>
            <div className="space-y-2">
              {PAYMENT_METHODS.map(({ value, label }) => (
                <label key={value} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="payment_methods" value={value} defaultChecked={chk(profile?.payment_methods ?? null, value)} className="accent-blue-500" />
                  <span className="text-sm text-zinc-300">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div>
          <p className={labelCls}>Amenities</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {AMENITIES.map((a) => (
              <label key={a} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="amenities" value={a} defaultChecked={chk(profile?.amenities ?? null, a)} className="accent-blue-500" />
                <span className="text-sm text-zinc-300">{a}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="languages_spoken" className={labelCls}>Languages spoken <span className="text-zinc-500">(comma-separated)</span></label>
          <input id="languages_spoken" name="languages_spoken" type="text" defaultValue={profile?.languages_spoken?.join(", ") ?? ""} className={inputCls} placeholder="English, Hindi, Marathi" />
        </div>
      </div>

      {/* ── Marketing ───────────────────────────────────────────────────── */}
      <div className={sectionCls}>
        <h3 className={headingCls}>Marketing Hooks</h3>
        <div>
          <label htmlFor="unique_selling_points" className={labelCls}>Unique selling points <span className="text-zinc-500">(one per line)</span></label>
          <textarea
            id="unique_selling_points"
            name="unique_selling_points"
            rows={4}
            defaultValue={profile?.unique_selling_points?.join("\n") ?? ""}
            className={inputCls}
            placeholder={"Award-winning barista\nOrganic, locally sourced ingredients\nBest view in the city"}
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
            "Save profile"
          )}
        </button>
      </div>
    </form>
  );
}
