-- Task template form fields and task output_data; Storage bucket for attachments

-- Field types for template form (text, textarea, number, date, url, file, file_multiple)
CREATE TYPE public.task_template_field_type AS ENUM (
  'text', 'textarea', 'number', 'date', 'url', 'file', 'file_multiple'
);

-- Form field definition per task template
CREATE TABLE public.task_template_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_template_id uuid NOT NULL REFERENCES public.task_templates(id) ON DELETE CASCADE,
  key text NOT NULL,
  label text NOT NULL,
  field_type public.task_template_field_type NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  required boolean NOT NULL DEFAULT false,
  options jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (task_template_id, key)
);

CREATE INDEX idx_task_template_fields_task_template_id ON public.task_template_fields(task_template_id);

-- Structured output per task (keyed by field key; file fields = array of storage paths/URLs)
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS output_data jsonb;

-- RLS for task_template_fields (same visibility as task_templates)
ALTER TABLE public.task_template_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_template_fields_select"
  ON public.task_template_fields FOR SELECT TO authenticated USING (true);
CREATE POLICY "task_template_fields_insert"
  ON public.task_template_fields FOR INSERT TO authenticated
  WITH CHECK (
    public.has_permission('users.manage') OR public.has_permission('task_templates.create')
  );
CREATE POLICY "task_template_fields_update"
  ON public.task_template_fields FOR UPDATE TO authenticated
  USING (
    public.has_permission('users.manage') OR public.has_permission('task_templates.update')
  )
  WITH CHECK (
    public.has_permission('users.manage') OR public.has_permission('task_templates.update')
  );
CREATE POLICY "task_template_fields_delete"
  ON public.task_template_fields FOR DELETE TO authenticated
  USING (
    public.has_permission('users.manage') OR public.has_permission('task_templates.delete')
  );

-- Helper: true if current user can access the task (same logic as tasks SELECT)
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
          WHERE cs.id = t.client_service_id AND c.assigned_ops_id = auth.uid()
        )
      )
      OR t.assignee_id = auth.uid()
    )
  );
$$;

-- Storage bucket for task attachments (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-attachments', 'task-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: path is task_id/field_key/filename; allow access if user can access task
CREATE POLICY "task_attachments_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'task-attachments'
    AND public.can_access_task(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "task_attachments_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'task-attachments'
    AND public.can_access_task(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "task_attachments_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'task-attachments'
    AND public.can_access_task(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "task_attachments_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'task-attachments'
    AND public.can_access_task(((storage.foldername(name))[1])::uuid)
  );
