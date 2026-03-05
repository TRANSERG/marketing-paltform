-- Fix infinite recursion: tasks_select -> task_viewers -> task_viewers_select -> tasks (RLS) -> ...
-- Use a SECURITY DEFINER function with row_security=off to check "can see task (non-viewer path)"
-- so reading tasks inside the policy does not trigger tasks_select (and thus task_viewers).

CREATE OR REPLACE FUNCTION public.can_see_task_without_viewers(p_task_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
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

DROP POLICY IF EXISTS "task_viewers_select" ON public.task_viewers;
CREATE POLICY "task_viewers_select"
  ON public.task_viewers FOR SELECT TO authenticated
  USING (
    task_viewers.user_id = (select auth.uid())
    OR public.can_see_task_without_viewers(task_viewers.task_id)
  );
