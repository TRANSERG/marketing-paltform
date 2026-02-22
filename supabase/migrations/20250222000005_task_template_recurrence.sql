-- Recurring tasks: configure recurrence on task templates (e.g. daily posting, weekly review)

CREATE TYPE public.task_recurrence_interval AS ENUM (
  'day', 'week', 'month'
);

ALTER TABLE public.task_templates
  ADD COLUMN IF NOT EXISTS is_recurring boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS recurrence_interval public.task_recurrence_interval,
  ADD COLUMN IF NOT EXISTS recurrence_interval_count int NOT NULL DEFAULT 1;

COMMENT ON COLUMN public.task_templates.is_recurring IS 'When true, completing a task from this template allows creating the next occurrence.';
COMMENT ON COLUMN public.task_templates.recurrence_interval IS 'Interval for next occurrence: day, week, or month. Used only when is_recurring is true.';
COMMENT ON COLUMN public.task_templates.recurrence_interval_count IS 'Every N intervals (e.g. 2 = every 2 weeks when interval is week).';
