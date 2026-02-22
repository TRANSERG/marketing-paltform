-- Service manager role: CRUD services and task templates

INSERT INTO public.roles (id, name, description) VALUES
  ('a0000000-0000-4000-8000-000000000005', 'service_manager', 'Manage service catalog and task templates: create, edit, and delete services and their task templates')
ON CONFLICT (name) DO NOTHING;

-- Grant new permissions to service_manager
INSERT INTO public.role_permissions (role_id, permission)
SELECT id, unnest(ARRAY[
  'services.create', 'services.update', 'services.delete',
  'task_templates.create', 'task_templates.read', 'task_templates.update', 'task_templates.delete'
])
FROM public.roles WHERE name = 'service_manager'
ON CONFLICT (role_id, permission) DO NOTHING;

-- Grant same permissions to admin so admin retains full access
INSERT INTO public.role_permissions (role_id, permission)
SELECT id, unnest(ARRAY[
  'services.create', 'services.update', 'services.delete',
  'task_templates.create', 'task_templates.read', 'task_templates.update', 'task_templates.delete'
])
FROM public.roles WHERE name = 'admin'
ON CONFLICT (role_id, permission) DO NOTHING;

-- services: allow write for users.manage OR services.create/update/delete
DROP POLICY IF EXISTS "services_insert" ON public.services;
CREATE POLICY "services_insert"
  ON public.services FOR INSERT TO authenticated
  WITH CHECK (public.has_permission('users.manage') OR public.has_permission('services.create'));

DROP POLICY IF EXISTS "services_update" ON public.services;
CREATE POLICY "services_update"
  ON public.services FOR UPDATE TO authenticated
  USING (public.has_permission('users.manage') OR public.has_permission('services.update'))
  WITH CHECK (public.has_permission('users.manage') OR public.has_permission('services.update'));

DROP POLICY IF EXISTS "services_delete" ON public.services;
CREATE POLICY "services_delete"
  ON public.services FOR DELETE TO authenticated
  USING (public.has_permission('users.manage') OR public.has_permission('services.delete'));

-- service_stages: allow write for users.manage OR services.update/delete (stages belong to services)
DROP POLICY IF EXISTS "service_stages_insert" ON public.service_stages;
CREATE POLICY "service_stages_insert"
  ON public.service_stages FOR INSERT TO authenticated
  WITH CHECK (public.has_permission('users.manage') OR public.has_permission('services.update'));

DROP POLICY IF EXISTS "service_stages_update" ON public.service_stages;
CREATE POLICY "service_stages_update"
  ON public.service_stages FOR UPDATE TO authenticated
  USING (public.has_permission('users.manage') OR public.has_permission('services.update'))
  WITH CHECK (public.has_permission('users.manage') OR public.has_permission('services.update'));

DROP POLICY IF EXISTS "service_stages_delete" ON public.service_stages;
CREATE POLICY "service_stages_delete"
  ON public.service_stages FOR DELETE TO authenticated
  USING (public.has_permission('users.manage') OR public.has_permission('services.delete'));

-- task_templates: allow write for users.manage OR task_templates.create/update/delete
DROP POLICY IF EXISTS "task_templates_insert" ON public.task_templates;
CREATE POLICY "task_templates_insert"
  ON public.task_templates FOR INSERT TO authenticated
  WITH CHECK (public.has_permission('users.manage') OR public.has_permission('task_templates.create'));

DROP POLICY IF EXISTS "task_templates_update" ON public.task_templates;
CREATE POLICY "task_templates_update"
  ON public.task_templates FOR UPDATE TO authenticated
  USING (public.has_permission('users.manage') OR public.has_permission('task_templates.update'))
  WITH CHECK (public.has_permission('users.manage') OR public.has_permission('task_templates.update'));

DROP POLICY IF EXISTS "task_templates_delete" ON public.task_templates;
CREATE POLICY "task_templates_delete"
  ON public.task_templates FOR DELETE TO authenticated
  USING (public.has_permission('users.manage') OR public.has_permission('task_templates.delete'));

-- task_template_checklist: same
DROP POLICY IF EXISTS "task_template_checklist_insert" ON public.task_template_checklist;
CREATE POLICY "task_template_checklist_insert"
  ON public.task_template_checklist FOR INSERT TO authenticated
  WITH CHECK (public.has_permission('users.manage') OR public.has_permission('task_templates.create'));

DROP POLICY IF EXISTS "task_template_checklist_update" ON public.task_template_checklist;
CREATE POLICY "task_template_checklist_update"
  ON public.task_template_checklist FOR UPDATE TO authenticated
  USING (public.has_permission('users.manage') OR public.has_permission('task_templates.update'))
  WITH CHECK (public.has_permission('users.manage') OR public.has_permission('task_templates.update'));

DROP POLICY IF EXISTS "task_template_checklist_delete" ON public.task_template_checklist;
CREATE POLICY "task_template_checklist_delete"
  ON public.task_template_checklist FOR DELETE TO authenticated
  USING (public.has_permission('users.manage') OR public.has_permission('task_templates.delete'));
