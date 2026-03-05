-- Content Calendar: social media post management
-- Tied to the "Content Calendar & Posting" service

CREATE TYPE public.post_platform AS ENUM (
  'instagram',
  'facebook',
  'linkedin',
  'twitter',
  'tiktok'
);

CREATE TYPE public.post_status AS ENUM (
  'draft',
  'scheduled',
  'published'
);

CREATE TABLE public.content_posts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  created_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  platform     public.post_platform NOT NULL,
  caption      text NOT NULL DEFAULT '',
  scheduled_at timestamptz NOT NULL,
  status       public.post_status NOT NULL DEFAULT 'draft',
  media_path   text,
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_content_posts_client_id    ON public.content_posts(client_id);
CREATE INDEX idx_content_posts_scheduled_at ON public.content_posts(scheduled_at);
CREATE INDEX idx_content_posts_client_month ON public.content_posts(client_id, scheduled_at);

ALTER TABLE public.content_posts ENABLE ROW LEVEL SECURITY;

-- Anyone with clients.read can view posts
CREATE POLICY "content_posts_select"
  ON public.content_posts FOR SELECT
  USING (public.has_permission('clients.read'));

-- Anyone with clients.read can create posts (must set created_by = self)
CREATE POLICY "content_posts_insert"
  ON public.content_posts FOR INSERT
  WITH CHECK (
    public.has_permission('clients.read')
    AND created_by = auth.uid()
  );

-- Anyone with clients.read can update posts
CREATE POLICY "content_posts_update"
  ON public.content_posts FOR UPDATE
  USING (public.has_permission('clients.read'));

-- Anyone with clients.read can delete posts
CREATE POLICY "content_posts_delete"
  ON public.content_posts FOR DELETE
  USING (public.has_permission('clients.read'));
