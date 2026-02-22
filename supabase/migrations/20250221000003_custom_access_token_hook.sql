-- Custom Access Token Hook: inject user_role and permissions into JWT.
-- Configure in Supabase Dashboard: Authentication -> Hooks -> Customize Access Token -> Postgres function: public.custom_access_token_hook
-- See: https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
  role_names text[];
  perms text[];
  primary_role text;
  merged_claims jsonb;
BEGIN
  uid := (event->>'user_id')::uuid;
  IF uid IS NULL THEN
    uid := (event->'claims'->>'sub')::uuid;
  END IF;
  IF uid IS NULL THEN
    RETURN jsonb_build_object('claims', event->'claims');
  END IF;

  -- Get all role names for this user (multiple roles supported)
  SELECT array_agg(r.name ORDER BY r.name)
  INTO role_names
  FROM public.user_roles ur
  JOIN public.roles r ON r.id = ur.role_id
  WHERE ur.user_id = uid;

  -- Get distinct permissions from all roles
  SELECT array_agg(DISTINCT rp.permission ORDER BY rp.permission)
  INTO perms
  FROM public.user_roles ur
  JOIN public.role_permissions rp ON rp.role_id = ur.role_id
  WHERE ur.user_id = uid;

  primary_role := COALESCE(role_names[1], 'authenticated');
  role_names := COALESCE(role_names, ARRAY[]::text[]);
  perms := COALESCE(perms, ARRAY[]::text[]);

  -- Merge new claims into existing (claims go under app_metadata or top-level; Supabase merges returned claims)
  merged_claims := (event->'claims')
    || jsonb_build_object(
         'user_role', primary_role,
         'user_roles', to_jsonb(role_names),
         'permissions', to_jsonb(perms)
       );

  RETURN jsonb_build_object('claims', merged_claims);
END;
$$;

-- Required for Supabase Auth to call the hook
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;

COMMENT ON FUNCTION public.custom_access_token_hook IS 'Auth hook: adds user_role, user_roles, permissions to JWT from public.user_roles and public.role_permissions.';
