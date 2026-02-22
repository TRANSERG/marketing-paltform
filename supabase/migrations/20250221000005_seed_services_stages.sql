-- Seed service catalog and default pipeline stages

-- Services (fixed UUIDs for deterministic references)
INSERT INTO public.services (id, name, description) VALUES
  ('b1000000-0000-4000-8000-000000000001', 'GBP Optimization', 'Google Business Profile setup, optimization, and ongoing management'),
  ('b1000000-0000-4000-8000-000000000002', 'Content Calendar & Posting', 'Content planning and regular posting on social media'),
  ('b1000000-0000-4000-8000-000000000003', 'Website', 'Website design, build, and launch')
ON CONFLICT (id) DO NOTHING;

-- GBP Optimization stages
INSERT INTO public.service_stages (service_id, name, sort_order)
SELECT id, v.name, v.sort_order
FROM public.services s,
     (VALUES ('Brief', 1), ('Audit', 2), ('Optimization', 3), ('Ongoing', 4)) AS v(name, sort_order)
WHERE s.name = 'GBP Optimization'
ON CONFLICT (service_id, name) DO NOTHING;

-- Content Calendar stages
INSERT INTO public.service_stages (service_id, name, sort_order)
SELECT id, v.name, v.sort_order
FROM public.services s,
     (VALUES ('Onboarding', 1), ('Content plan', 2), ('Scheduling', 3), ('Live', 4)) AS v(name, sort_order)
WHERE s.name = 'Content Calendar & Posting'
ON CONFLICT (service_id, name) DO NOTHING;

-- Website stages
INSERT INTO public.service_stages (service_id, name, sort_order)
SELECT id, v.name, v.sort_order
FROM public.services s,
     (VALUES ('Discovery', 1), ('Design', 2), ('Build', 3), ('Launch', 4)) AS v(name, sort_order)
WHERE s.name = 'Website'
ON CONFLICT (service_id, name) DO NOTHING;
