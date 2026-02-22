-- Task templates and tasks: service = set of task templates; client opts in -> tasks created

CREATE TYPE public.task_status AS ENUM (
  'draft', 'scheduled', 'ongoing', 'overdue', 'completed', 'cancelled'
);

-- Task template: defines a task type under a service (replaces stage as unit of work)
CREATE TABLE public.task_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  sort_order int NOT NULL DEFAULT 0,
  default_due_offset_days int,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_task_templates_service_id ON public.task_templates(service_id);

-- Optional checklist template: labels copied to each task instance
CREATE TABLE public.task_template_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_template_id uuid NOT NULL REFERENCES public.task_templates(id) ON DELETE CASCADE,
  label text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_task_template_checklist_task_template_id ON public.task_template_checklist(task_template_id);

-- Task instance: created when client gets a service (one per template)
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_service_id uuid NOT NULL REFERENCES public.client_services(id) ON DELETE CASCADE,
  task_template_id uuid NOT NULL REFERENCES public.task_templates(id) ON DELETE RESTRICT,
  assignee_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text,
  due_date date,
  scheduled_at timestamptz,
  status public.task_status NOT NULL DEFAULT 'scheduled',
  output text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_client_service_id ON public.tasks(client_service_id);
CREATE INDEX idx_tasks_assignee_id ON public.tasks(assignee_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);

-- Per-task checklist (can be seeded from task_template_checklist)
CREATE TABLE public.task_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  label text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_task_checklist_items_task_id ON public.task_checklist_items(task_id);

-- Seed task_templates from existing service_stages (one template per stage)
INSERT INTO public.task_templates (service_id, name, description, sort_order, default_due_offset_days)
SELECT ss.service_id, ss.name, NULL, ss.sort_order,
       (ss.sort_order * 7)  -- default: 7, 14, 21, 28 days after add
FROM public.service_stages ss
ORDER BY ss.service_id, ss.sort_order;

-- RLS
ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_template_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_checklist_items ENABLE ROW LEVEL SECURITY;

-- task_templates: read all authenticated; write for users.manage (service_manager added in next migration)
CREATE POLICY "task_templates_select"
  ON public.task_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "task_templates_insert"
  ON public.task_templates FOR INSERT TO authenticated
  WITH CHECK (public.has_permission('users.manage'));
CREATE POLICY "task_templates_update"
  ON public.task_templates FOR UPDATE TO authenticated
  USING (public.has_permission('users.manage'))
  WITH CHECK (public.has_permission('users.manage'));
CREATE POLICY "task_templates_delete"
  ON public.task_templates FOR DELETE TO authenticated
  USING (public.has_permission('users.manage'));

-- task_template_checklist: same as task_templates
CREATE POLICY "task_template_checklist_select"
  ON public.task_template_checklist FOR SELECT TO authenticated USING (true);
CREATE POLICY "task_template_checklist_insert"
  ON public.task_template_checklist FOR INSERT TO authenticated
  WITH CHECK (public.has_permission('users.manage'));
CREATE POLICY "task_template_checklist_update"
  ON public.task_template_checklist FOR UPDATE TO authenticated
  USING (public.has_permission('users.manage'))
  WITH CHECK (public.has_permission('users.manage'));
CREATE POLICY "task_template_checklist_delete"
  ON public.task_template_checklist FOR DELETE TO authenticated
  USING (public.has_permission('users.manage'));

-- tasks: same visibility as client_services; assignee or client_services.update_stage can update
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
          AND c.assigned_ops_id = auth.uid()
      )
    )
  );

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
          AND c.assigned_ops_id = auth.uid()
      )
    )
  );

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
          AND c.assigned_ops_id = auth.uid()
      )
    )
    OR assignee_id = auth.uid()
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
          AND c.assigned_ops_id = auth.uid()
      )
    )
    OR assignee_id = auth.uid()
  );

CREATE POLICY "tasks_delete"
  ON public.tasks FOR DELETE TO authenticated
  USING (
    public.has_permission('clients.update')
    OR public.has_permission('users.manage')
  );

-- task_checklist_items: same visibility as tasks (via task_id)
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
            WHERE cs.id = t.client_service_id AND c.assigned_ops_id = auth.uid()
          )
        )
      )
    )
  );

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
            WHERE cs.id = t.client_service_id AND c.assigned_ops_id = auth.uid()
          )
        )
        OR t.assignee_id = auth.uid()
      )
    )
  );

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
            WHERE cs.id = t.client_service_id AND c.assigned_ops_id = auth.uid()
          )
        )
        OR t.assignee_id = auth.uid()
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
            WHERE cs.id = t.client_service_id AND c.assigned_ops_id = auth.uid()
          )
        )
        OR t.assignee_id = auth.uid()
      )
    )
  );

CREATE POLICY "task_checklist_items_delete"
  ON public.task_checklist_items FOR DELETE TO authenticated
  USING (
    public.has_permission('clients.update')
    OR public.has_permission('users.manage')
  );
