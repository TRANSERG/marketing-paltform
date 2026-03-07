-- Client Profile: rich business info, brand identity, offerings, team, and media assets
-- Supports all business types: cafes, salons, gyms, retail, clinics, real estate, etc.

-- ─── Extend clients table ──────────────────────────────────────────────────

ALTER TABLE public.clients
  ADD COLUMN website          text,
  ADD COLUMN business_category text,
  ADD COLUMN tagline          text;

-- ─── client_profile (1:1 rich extension) ───────────────────────────────────

CREATE TABLE public.client_profile (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id             uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,

  -- About
  description           text,
  founded_year          int,
  team_size             text CHECK (team_size IN ('solo', '2-5', '6-20', '20+')),
  price_range           text CHECK (price_range IN ('$', '$$', '$$$', '$$$$')),
  target_audience       text,

  -- Structured address
  street_address        text,
  city                  text,
  state                 text,
  postal_code           text,
  country               text,

  -- Social & online presence
  instagram_handle      text,
  facebook_handle       text,
  tiktok_handle         text,
  youtube_handle        text,
  google_business_url   text,
  booking_link          text,   -- Fresha, Booksy, Mindbody (salons/gyms)
  order_link            text,   -- Swiggy, Zomato, DoorDash (food)

  -- Operational details
  delivery_platforms    text[],   -- ['ubereats', 'zomato']
  payment_methods       text[],   -- ['cash', 'card', 'upi']
  working_hours         jsonb,    -- [{day:'mon', open:'09:00', close:'18:00', closed:false}]
  special_hours         jsonb,    -- [{date:'2025-12-25', label:'Christmas', closed:true}]
  amenities             text[],   -- ['Free WiFi', 'Parking', 'AC']
  languages_spoken      text[],   -- ['English', 'Hindi']

  -- Marketing hooks (feeds content generation)
  unique_selling_points text[],   -- ['Award-winning chef', 'Organic ingredients']

  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),

  UNIQUE (client_id)
);

-- ─── client_brand (1:1 brand identity) ─────────────────────────────────────

CREATE TABLE public.client_brand (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,

  -- Logo
  logo_path         text,   -- Supabase Storage path

  -- Colors
  primary_color     text,   -- #hex
  secondary_color   text,
  accent_color      text,
  background_color  text,

  -- Typography
  heading_font      text,   -- 'Playfair Display'
  body_font         text,   -- 'Inter'

  -- Voice & tone
  brand_tone        text CHECK (brand_tone IN (
    'professional', 'friendly', 'playful', 'bold',
    'luxurious', 'earthy', 'minimalist', 'edgy'
  )),
  style_notes       text,   -- free-text brand voice guidelines

  -- Content strategy
  content_themes    text[],   -- ['behind-the-scenes', 'promotions', 'testimonials']
  hashtags          text[],   -- go-to hashtags for every post

  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),

  UNIQUE (client_id)
);

-- ─── client_offerings (menu items / services / classes / products) ──────────

CREATE TABLE public.client_offerings (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,

  offering_type     text NOT NULL CHECK (offering_type IN (
    'menu_item', 'service', 'class', 'product', 'membership', 'package'
  )),
  category          text,             -- "Mains" / "Hair Services" / "Yoga"
  name              text NOT NULL,
  description       text,
  price             numeric(10, 2),
  currency          text NOT NULL DEFAULT 'INR',
  duration_minutes  int,              -- for services/classes
  is_available      boolean NOT NULL DEFAULT true,
  is_featured       boolean NOT NULL DEFAULT false,  -- flag for content generation
  tags              text[],           -- ['vegan', 'bestseller', 'new', 'seasonal']
  sort_order        int NOT NULL DEFAULT 0,

  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- ─── client_team_members (stylists, chefs, trainers, etc.) ─────────────────

CREATE TABLE public.client_team_members (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,

  name              text NOT NULL,
  role              text,             -- "Senior Stylist", "Head Chef", "Personal Trainer"
  bio               text,
  photo_path        text,             -- Supabase Storage path
  specialties       text[],           -- ['Balayage', 'Bridal', 'Keratin']
  instagram_handle  text,             -- individual handle for content tagging
  is_active         boolean NOT NULL DEFAULT true,
  sort_order        int NOT NULL DEFAULT 0,

  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- ─── client_assets (media library: photos, videos, design files) ────────────

CREATE TABLE public.client_assets (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  created_by        uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  asset_type        text NOT NULL CHECK (asset_type IN (
    'photo', 'video', 'menu_design', 'logo', 'graphic', 'document', 'other'
  )),
  category          text CHECK (category IN (
    'food', 'drinks', 'interior', 'exterior', 'team', 'product',
    'event', 'before_after', 'packaging', 'other'
  )),
  file_path         text NOT NULL,    -- Supabase Storage path
  file_name         text,
  file_size         bigint,
  mime_type         text,
  alt_text          text,
  tags              text[],
  is_featured       boolean NOT NULL DEFAULT false,  -- show prominently in content gen

  created_at        timestamptz NOT NULL DEFAULT now()
);

-- ─── Indexes ────────────────────────────────────────────────────────────────

CREATE INDEX idx_client_profile_client_id       ON public.client_profile(client_id);
CREATE INDEX idx_client_brand_client_id         ON public.client_brand(client_id);
CREATE INDEX idx_client_offerings_client_id     ON public.client_offerings(client_id);
CREATE INDEX idx_client_offerings_type          ON public.client_offerings(client_id, offering_type);
CREATE INDEX idx_client_offerings_featured      ON public.client_offerings(client_id, is_featured);
CREATE INDEX idx_client_team_members_client_id  ON public.client_team_members(client_id);
CREATE INDEX idx_client_assets_client_id        ON public.client_assets(client_id);
CREATE INDEX idx_client_assets_type             ON public.client_assets(client_id, asset_type);

-- ─── RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE public.client_profile      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_brand        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_offerings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_assets       ENABLE ROW LEVEL SECURITY;

-- client_profile
CREATE POLICY "client_profile_select" ON public.client_profile FOR SELECT TO authenticated
  USING (public.has_permission('clients.read') OR public.has_permission('users.manage'));

CREATE POLICY "client_profile_insert" ON public.client_profile FOR INSERT TO authenticated
  WITH CHECK (public.has_permission('clients.update') OR public.has_permission('users.manage'));

CREATE POLICY "client_profile_update" ON public.client_profile FOR UPDATE TO authenticated
  USING (public.has_permission('clients.update') OR public.has_permission('users.manage'))
  WITH CHECK (public.has_permission('clients.update') OR public.has_permission('users.manage'));

CREATE POLICY "client_profile_delete" ON public.client_profile FOR DELETE TO authenticated
  USING (public.has_permission('users.manage'));

-- client_brand
CREATE POLICY "client_brand_select" ON public.client_brand FOR SELECT TO authenticated
  USING (public.has_permission('clients.read') OR public.has_permission('users.manage'));

CREATE POLICY "client_brand_insert" ON public.client_brand FOR INSERT TO authenticated
  WITH CHECK (public.has_permission('clients.update') OR public.has_permission('users.manage'));

CREATE POLICY "client_brand_update" ON public.client_brand FOR UPDATE TO authenticated
  USING (public.has_permission('clients.update') OR public.has_permission('users.manage'))
  WITH CHECK (public.has_permission('clients.update') OR public.has_permission('users.manage'));

CREATE POLICY "client_brand_delete" ON public.client_brand FOR DELETE TO authenticated
  USING (public.has_permission('users.manage'));

-- client_offerings
CREATE POLICY "client_offerings_select" ON public.client_offerings FOR SELECT TO authenticated
  USING (public.has_permission('clients.read') OR public.has_permission('users.manage'));

CREATE POLICY "client_offerings_insert" ON public.client_offerings FOR INSERT TO authenticated
  WITH CHECK (public.has_permission('clients.update') OR public.has_permission('users.manage'));

CREATE POLICY "client_offerings_update" ON public.client_offerings FOR UPDATE TO authenticated
  USING (public.has_permission('clients.update') OR public.has_permission('users.manage'))
  WITH CHECK (public.has_permission('clients.update') OR public.has_permission('users.manage'));

CREATE POLICY "client_offerings_delete" ON public.client_offerings FOR DELETE TO authenticated
  USING (public.has_permission('clients.update') OR public.has_permission('users.manage'));

-- client_team_members
CREATE POLICY "client_team_members_select" ON public.client_team_members FOR SELECT TO authenticated
  USING (public.has_permission('clients.read') OR public.has_permission('users.manage'));

CREATE POLICY "client_team_members_insert" ON public.client_team_members FOR INSERT TO authenticated
  WITH CHECK (public.has_permission('clients.update') OR public.has_permission('users.manage'));

CREATE POLICY "client_team_members_update" ON public.client_team_members FOR UPDATE TO authenticated
  USING (public.has_permission('clients.update') OR public.has_permission('users.manage'))
  WITH CHECK (public.has_permission('clients.update') OR public.has_permission('users.manage'));

CREATE POLICY "client_team_members_delete" ON public.client_team_members FOR DELETE TO authenticated
  USING (public.has_permission('clients.update') OR public.has_permission('users.manage'));

-- client_assets
CREATE POLICY "client_assets_select" ON public.client_assets FOR SELECT TO authenticated
  USING (public.has_permission('clients.read') OR public.has_permission('users.manage'));

CREATE POLICY "client_assets_insert" ON public.client_assets FOR INSERT TO authenticated
  WITH CHECK (
    (public.has_permission('clients.update') OR public.has_permission('users.manage'))
    AND created_by = auth.uid()
  );

CREATE POLICY "client_assets_update" ON public.client_assets FOR UPDATE TO authenticated
  USING (public.has_permission('clients.update') OR public.has_permission('users.manage'))
  WITH CHECK (public.has_permission('clients.update') OR public.has_permission('users.manage'));

CREATE POLICY "client_assets_delete" ON public.client_assets FOR DELETE TO authenticated
  USING (public.has_permission('clients.update') OR public.has_permission('users.manage'));
