-- Add nullable description to tasks (task_templates already has description)
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS description text;
