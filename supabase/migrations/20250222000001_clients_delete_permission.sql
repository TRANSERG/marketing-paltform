-- Add clients.delete permission and grant to admin; allow DELETE for clients.delete or users.manage

INSERT INTO public.role_permissions (role_id, permission)
SELECT id, 'clients.delete'
FROM public.roles
WHERE name = 'admin'
ON CONFLICT (role_id, permission) DO NOTHING;

-- RLS: allow DELETE on clients for users with clients.delete or users.manage
DROP POLICY IF EXISTS "clients_delete" ON public.clients;
CREATE POLICY "clients_delete"
  ON public.clients FOR DELETE TO authenticated
  USING (
    public.has_permission('clients.delete') OR public.has_permission('users.manage')
  );
