-- Allow users with users.manage to INSERT, UPDATE, DELETE roles (for role management UI)
CREATE POLICY "roles_admin_insert"
  ON public.roles FOR INSERT TO authenticated
  WITH CHECK (public.has_permission('users.manage'));

CREATE POLICY "roles_admin_update"
  ON public.roles FOR UPDATE TO authenticated
  USING (public.has_permission('users.manage'))
  WITH CHECK (public.has_permission('users.manage'));

CREATE POLICY "roles_admin_delete"
  ON public.roles FOR DELETE TO authenticated
  USING (public.has_permission('users.manage'));
