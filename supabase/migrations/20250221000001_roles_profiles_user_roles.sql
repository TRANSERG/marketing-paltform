-- Extensible roles table (no enum: add roles via INSERT)
CREATE TABLE public.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Profiles: one per auth user (display name, avatar, etc.)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  timezone text DEFAULT 'UTC',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- User -> role assignment (multiple roles per user supported)
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role_id)
);

-- Role -> permission mapping (permission is a string e.g. 'clients.create')
CREATE TABLE public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (role_id, permission)
);

-- Indexes for auth hook and RLS
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_role_permissions_role_id ON public.role_permissions(role_id);

-- Trigger: create profile when a new auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper: check if current user's JWT contains a permission (set by Custom Access Token Hook).
-- Hook should set auth.jwt().claims.permissions = ['clients.create', ...] or root-level 'permissions'.
CREATE OR REPLACE FUNCTION public.has_permission(permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'claims' -> 'permissions') @> to_jsonb(permission::text),
    (auth.jwt() -> 'permissions') @> to_jsonb(permission::text),
    false
  );
$$;

-- Enable RLS on all tables
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- roles: readable by authenticated users (for UI); only service_role or admin can modify (we use admin permission in app)
CREATE POLICY "roles_select_authenticated"
  ON public.roles FOR SELECT TO authenticated USING (true);

-- profiles: everyone authenticated can read (team list); users can update own
CREATE POLICY "profiles_select_authenticated"
  ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- user_roles: any authenticated user can read their own rows (required for Custom Access Token Hook).
CREATE POLICY "user_roles_select_own"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Only users with permission 'users.manage' (admin) can insert/update/delete user_roles.
-- We use a helper that reads from JWT claims set by the Custom Access Token Hook.
CREATE POLICY "user_roles_admin_modify"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_permission('users.manage'));
CREATE POLICY "user_roles_admin_update"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (public.has_permission('users.manage'))
  WITH CHECK (public.has_permission('users.manage'));
CREATE POLICY "user_roles_admin_delete"
  ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_permission('users.manage'));

-- role_permissions: readable by authenticated (for admin UI and for hook - hook runs as user, so we need role_permissions readable)
-- Hook runs in Edge Function or with a DB function called with auth.uid(); the function can read role_permissions.
-- So we need SELECT for authenticated. Mutations only for admin.
CREATE POLICY "role_permissions_select_authenticated"
  ON public.role_permissions FOR SELECT TO authenticated USING (true);

CREATE POLICY "role_permissions_admin_insert"
  ON public.role_permissions FOR INSERT TO authenticated
  WITH CHECK (public.has_permission('users.manage'));
CREATE POLICY "role_permissions_admin_update"
  ON public.role_permissions FOR UPDATE TO authenticated
  USING (public.has_permission('users.manage'))
  WITH CHECK (public.has_permission('users.manage'));
CREATE POLICY "role_permissions_admin_delete"
  ON public.role_permissions FOR DELETE TO authenticated
  USING (public.has_permission('users.manage'));

COMMENT ON TABLE public.roles IS 'Extensible roles; add new roles by inserting rows.';
COMMENT ON TABLE public.user_roles IS 'User can have multiple roles; Custom Access Token Hook aggregates permissions.';
COMMENT ON TABLE public.role_permissions IS 'Maps role to permission strings; RLS policies use has_permission() helper.';
