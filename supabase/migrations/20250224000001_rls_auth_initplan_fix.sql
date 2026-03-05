-- Fix Auth RLS Initialization Plan: use (select auth.uid()) and (select auth.jwt()) so values
-- are evaluated once per query instead of per row. Also merge user_roles SELECT policies into one.

-- 1. has_permission: evaluate JWT once per query
CREATE OR REPLACE FUNCTION public.has_permission(permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT COALESCE(
    ((select auth.jwt()) -> 'claims' -> 'permissions') @> to_jsonb(permission::text),
    ((select auth.jwt()) -> 'permissions') @> to_jsonb(permission::text),
    false
  );
$$;

-- 2. profiles: profiles_update_own
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- 3. user_roles: merge user_roles_select_own and user_roles_select_admin into one policy
DROP POLICY IF EXISTS "user_roles_select_admin" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_select_own" ON public.user_roles;
CREATE POLICY "user_roles_select"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()) OR public.has_permission('users.manage'));

-- 4. clients: clients_select, clients_update
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
      AND assigned_ops_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "clients_update" ON public.clients;
CREATE POLICY "clients_update"
  ON public.clients FOR UPDATE TO authenticated
  USING (
    public.has_permission('clients.update')
    OR public.has_permission('users.manage')
    OR (
      public.has_permission('client_services.update_stage')
      AND assigned_ops_id = (select auth.uid())
    )
  )
  WITH CHECK (
    public.has_permission('clients.update')
    OR public.has_permission('users.manage')
    OR (
      public.has_permission('client_services.update_stage')
      AND assigned_ops_id = (select auth.uid())
    )
  );

-- 5. client_services: client_services_select, client_services_update
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
          AND c.assigned_ops_id = (select auth.uid())
      )
    )
  );

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
          AND c.assigned_ops_id = (select auth.uid())
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
          AND c.assigned_ops_id = (select auth.uid())
      )
    )
  );

-- 6. client_service_stages: select, insert, update, delete
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
          AND c.assigned_ops_id = (select auth.uid())
      )
    )
  );

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
          AND c.assigned_ops_id = (select auth.uid())
      )
    )
  );

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
          AND c.assigned_ops_id = (select auth.uid())
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
          AND c.assigned_ops_id = (select auth.uid())
      )
    )
  );

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
          AND c.assigned_ops_id = (select auth.uid())
      )
    )
  );

-- 7. tasks: tasks_select, tasks_insert, tasks_update
DROP POLICY IF EXISTS "tasks_select" ON public.tasks;
CREATE POLICY "tasks_select"
  ON public.tasks FOR SELECT TO authenticated
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
        WHERE cs.id = tasks.client_service_id
          AND c.assigned_ops_id = (select auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "tasks_insert" ON public.tasks;
CREATE POLICY "tasks_insert"
  ON public.tasks FOR INSERT TO authenticated
  WITH CHECK (
    public.has_permission('clients.update')
    OR public.has_permission('users.manage')
    OR (
      public.has_permission('client_services.update_stage')
      AND EXISTS (
        SELECT 1 FROM public.client_services cs
        JOIN public.clients c ON c.id = cs.client_id
        WHERE cs.id = tasks.client_service_id
          AND c.assigned_ops_id = (select auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "tasks_update" ON public.tasks;
CREATE POLICY "tasks_update"
  ON public.tasks FOR UPDATE TO authenticated
  USING (
    public.has_permission('users.manage')
    OR public.has_permission('clients.update')
    OR (
      public.has_permission('client_services.update_stage')
      AND EXISTS (
        SELECT 1 FROM public.client_services cs
        JOIN public.clients c ON c.id = cs.client_id
        WHERE cs.id = tasks.client_service_id
          AND c.assigned_ops_id = (select auth.uid())
      )
    )
    OR assignee_id = (select auth.uid())
  )
  WITH CHECK (
    public.has_permission('users.manage')
    OR public.has_permission('clients.update')
    OR (
      public.has_permission('client_services.update_stage')
      AND EXISTS (
        SELECT 1 FROM public.client_services cs
        JOIN public.clients c ON c.id = cs.client_id
        WHERE cs.id = tasks.client_service_id
          AND c.assigned_ops_id = (select auth.uid())
      )
    )
    OR assignee_id = (select auth.uid())
  );

-- 8. task_checklist_items: select, insert, update
DROP POLICY IF EXISTS "task_checklist_items_select" ON public.task_checklist_items;
CREATE POLICY "task_checklist_items_select"
  ON public.task_checklist_items FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_checklist_items.task_id
      AND (
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
            WHERE cs.id = t.client_service_id AND c.assigned_ops_id = (select auth.uid())
          )
        )
      )
    )
  );

DROP POLICY IF EXISTS "task_checklist_items_insert" ON public.task_checklist_items;
CREATE POLICY "task_checklist_items_insert"
  ON public.task_checklist_items FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_checklist_items.task_id
      AND (
        public.has_permission('users.manage')
        OR public.has_permission('clients.update')
        OR (
          public.has_permission('client_services.update_stage')
          AND EXISTS (
            SELECT 1 FROM public.client_services cs
            JOIN public.clients c ON c.id = cs.client_id
            WHERE cs.id = t.client_service_id AND c.assigned_ops_id = (select auth.uid())
          )
        )
        OR t.assignee_id = (select auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "task_checklist_items_update" ON public.task_checklist_items;
CREATE POLICY "task_checklist_items_update"
  ON public.task_checklist_items FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_checklist_items.task_id
      AND (
        public.has_permission('users.manage')
        OR public.has_permission('clients.update')
        OR (
          public.has_permission('client_services.update_stage')
          AND EXISTS (
            SELECT 1 FROM public.client_services cs
            JOIN public.clients c ON c.id = cs.client_id
            WHERE cs.id = t.client_service_id AND c.assigned_ops_id = (select auth.uid())
          )
        )
        OR t.assignee_id = (select auth.uid())
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_checklist_items.task_id
      AND (
        public.has_permission('users.manage')
        OR public.has_permission('clients.update')
        OR (
          public.has_permission('client_services.update_stage')
          AND EXISTS (
            SELECT 1 FROM public.client_services cs
            JOIN public.clients c ON c.id = cs.client_id
            WHERE cs.id = t.client_service_id AND c.assigned_ops_id = (select auth.uid())
          )
        )
        OR t.assignee_id = (select auth.uid())
      )
    )
  );

-- 9. can_access_task(): use (select auth.uid()) so storage policies don't re-evaluate per row
CREATE OR REPLACE FUNCTION public.can_access_task(p_task_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = p_task_id
    AND (
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
          WHERE cs.id = t.client_service_id AND c.assigned_ops_id = (select auth.uid())
        )
      )
      OR t.assignee_id = (select auth.uid())
    )
  );
$$;
