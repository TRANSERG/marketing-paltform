-- Task assignee, viewers, and assigned_by: schema and RLS

-- 1. tasks: add assigned_by_id
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS assigned_by_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_assigned_by_id ON public.tasks(assigned_by_id);

-- 2. task_viewers: many-to-many (who can view this task)
CREATE TABLE IF NOT EXISTS public.task_viewers (
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_task_viewers_task_id ON public.task_viewers(task_id);
CREATE INDEX IF NOT EXISTS idx_task_viewers_user_id ON public.task_viewers(user_id);

-- 3. tasks_select: allow SELECT if user is a viewer
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
    OR EXISTS (
      SELECT 1 FROM public.task_viewers tv
      WHERE tv.task_id = tasks.id AND tv.user_id = (select auth.uid())
    )
  );

-- 4. task_viewers RLS
ALTER TABLE public.task_viewers ENABLE ROW LEVEL SECURITY;

-- SELECT: same visibility as the task (can see task -> can see its viewer list)
DROP POLICY IF EXISTS "task_viewers_select" ON public.task_viewers;
CREATE POLICY "task_viewers_select"
  ON public.task_viewers FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_viewers.task_id
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
        OR EXISTS (
          SELECT 1 FROM public.task_viewers tv2
          WHERE tv2.task_id = t.id AND tv2.user_id = (select auth.uid())
        )
      )
    )
  );

-- INSERT/DELETE (and UPDATE): only if user can update the task
DROP POLICY IF EXISTS "task_viewers_insert" ON public.task_viewers;
CREATE POLICY "task_viewers_insert"
  ON public.task_viewers FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_viewers.task_id
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

DROP POLICY IF EXISTS "task_viewers_delete" ON public.task_viewers;
CREATE POLICY "task_viewers_delete"
  ON public.task_viewers FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_viewers.task_id
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

-- 5. can_access_task(): add viewer condition so storage/other logic grants access to viewers
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
      OR EXISTS (
        SELECT 1 FROM public.task_viewers tv
        WHERE tv.task_id = t.id AND tv.user_id = (select auth.uid())
      )
    )
  );
$$;

-- 6. task_checklist_items_select: allow viewers to see checklist for tasks they can view
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
        OR t.assignee_id = (select auth.uid())
        OR EXISTS (
          SELECT 1 FROM public.task_viewers tv
          WHERE tv.task_id = t.id AND tv.user_id = (select auth.uid())
        )
      )
    )
  );
