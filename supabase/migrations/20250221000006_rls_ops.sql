-- Phase 3: RLS so ops see only assigned clients and can update stages

-- user_roles: allow admin to read all (for assignment dropdown and user management)
CREATE POLICY "user_roles_select_admin"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_permission('users.manage'));

-- clients: SELECT - admin sees all; sales (clients.read, no ops perm) sees all; ops sees only assigned
DROP POLICY IF EXISTS "clients_select" ON public.clients;
CREATE POLICY "clients_select"
  ON public.clients FOR SELECT TO authenticated
  USING (
    public.has_permission('users.manage')
    OR (
      public.has_permission('clients.read')
      AND NOT public.has_permission('client_services.update_stage')
    )
    OR (
      public.has_permission('client_services.update_stage')
      AND assigned_ops_id = auth.uid()
    )
  );

-- clients: UPDATE - allow ops to update their assigned clients (app does not let ops set assigned_ops_id)
DROP POLICY IF EXISTS "clients_update" ON public.clients;
CREATE POLICY "clients_update"
  ON public.clients FOR UPDATE TO authenticated
  USING (
    public.has_permission('clients.update')
    OR public.has_permission('users.manage')
    OR (
      public.has_permission('client_services.update_stage')
      AND assigned_ops_id = auth.uid()
    )
  )
  WITH CHECK (
    public.has_permission('clients.update')
    OR public.has_permission('users.manage')
    OR (
      public.has_permission('client_services.update_stage')
      AND assigned_ops_id = auth.uid()
    )
  );

-- client_services: SELECT - same visibility as clients
DROP POLICY IF EXISTS "client_services_select" ON public.client_services;
CREATE POLICY "client_services_select"
  ON public.client_services FOR SELECT TO authenticated
  USING (
    public.has_permission('users.manage')
    OR (
      public.has_permission('clients.read')
      AND NOT public.has_permission('client_services.update_stage')
    )
    OR (
      public.has_permission('client_services.update_stage')
      AND EXISTS (
        SELECT 1 FROM public.clients c
        WHERE c.id = client_services.client_id
          AND c.assigned_ops_id = auth.uid()
      )
    )
  );

-- client_services: UPDATE - sales/admin or ops for assigned clients
DROP POLICY IF EXISTS "client_services_update" ON public.client_services;
CREATE POLICY "client_services_update"
  ON public.client_services FOR UPDATE TO authenticated
  USING (
    public.has_permission('clients.update')
    OR public.has_permission('users.manage')
    OR (
      public.has_permission('client_services.update_stage')
      AND EXISTS (
        SELECT 1 FROM public.clients c
        WHERE c.id = client_services.client_id
          AND c.assigned_ops_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    public.has_permission('clients.update')
    OR public.has_permission('users.manage')
    OR (
      public.has_permission('client_services.update_stage')
      AND EXISTS (
        SELECT 1 FROM public.clients c
        WHERE c.id = client_services.client_id
          AND c.assigned_ops_id = auth.uid()
      )
    )
  );

-- client_service_stages: SELECT
DROP POLICY IF EXISTS "client_service_stages_select" ON public.client_service_stages;
CREATE POLICY "client_service_stages_select"
  ON public.client_service_stages FOR SELECT TO authenticated
  USING (
    public.has_permission('users.manage')
    OR (
      public.has_permission('clients.read')
      AND NOT public.has_permission('client_services.update_stage')
    )
    OR (
      public.has_permission('client_services.update_stage')
      AND EXISTS (
        SELECT 1 FROM public.client_services cs
        JOIN public.clients c ON c.id = cs.client_id
        WHERE cs.id = client_service_stages.client_service_id
          AND c.assigned_ops_id = auth.uid()
      )
    )
  );

-- client_service_stages: INSERT
DROP POLICY IF EXISTS "client_service_stages_insert" ON public.client_service_stages;
CREATE POLICY "client_service_stages_insert"
  ON public.client_service_stages FOR INSERT TO authenticated
  WITH CHECK (
    public.has_permission('clients.update')
    OR public.has_permission('users.manage')
    OR (
      public.has_permission('client_services.update_stage')
      AND EXISTS (
        SELECT 1 FROM public.client_services cs
        JOIN public.clients c ON c.id = cs.client_id
        WHERE cs.id = client_service_stages.client_service_id
          AND c.assigned_ops_id = auth.uid()
      )
    )
  );

-- client_service_stages: UPDATE
DROP POLICY IF EXISTS "client_service_stages_update" ON public.client_service_stages;
CREATE POLICY "client_service_stages_update"
  ON public.client_service_stages FOR UPDATE TO authenticated
  USING (
    public.has_permission('clients.update')
    OR public.has_permission('users.manage')
    OR (
      public.has_permission('client_services.update_stage')
      AND EXISTS (
        SELECT 1 FROM public.client_services cs
        JOIN public.clients c ON c.id = cs.client_id
        WHERE cs.id = client_service_stages.client_service_id
          AND c.assigned_ops_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    public.has_permission('clients.update')
    OR public.has_permission('users.manage')
    OR (
      public.has_permission('client_services.update_stage')
      AND EXISTS (
        SELECT 1 FROM public.client_services cs
        JOIN public.clients c ON c.id = cs.client_id
        WHERE cs.id = client_service_stages.client_service_id
          AND c.assigned_ops_id = auth.uid()
      )
    )
  );

-- client_service_stages: DELETE
DROP POLICY IF EXISTS "client_service_stages_delete" ON public.client_service_stages;
CREATE POLICY "client_service_stages_delete"
  ON public.client_service_stages FOR DELETE TO authenticated
  USING (
    public.has_permission('clients.update')
    OR public.has_permission('users.manage')
    OR (
      public.has_permission('client_services.update_stage')
      AND EXISTS (
        SELECT 1 FROM public.client_services cs
        JOIN public.clients c ON c.id = cs.client_id
        WHERE cs.id = client_service_stages.client_service_id
          AND c.assigned_ops_id = auth.uid()
      )
    )
  );
