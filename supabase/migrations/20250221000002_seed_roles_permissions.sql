-- Seed roles (extensible: add more rows later)
INSERT INTO public.roles (id, name, description) VALUES
  ('a0000000-0000-4000-8000-000000000001', 'admin', 'Full access: users, roles, all clients, services, settings'),
  ('a0000000-0000-4000-8000-000000000002', 'sales', 'Create/edit leads and clients until closed; view pipeline'),
  ('a0000000-0000-4000-8000-000000000003', 'ops', 'View assigned clients; manage stages and delivery'),
  ('a0000000-0000-4000-8000-000000000004', 'client', 'See only own client data and content (future client portal)')
ON CONFLICT (name) DO NOTHING;

-- Seed permissions per role
-- Admin: all permissions
INSERT INTO public.role_permissions (role_id, permission)
SELECT id, unnest(ARRAY[
  'users.manage', 'users.read', 'clients.create', 'clients.read', 'clients.update', 'clients.delete', 'clients.assign_ops', 'clients.change_status_to_closed',
  'client_services.read', 'client_services.update_stage', 'client_services.assign',
  'content.read', 'content.create', 'content.update', 'reports.read'
])
FROM public.roles WHERE name = 'admin'
ON CONFLICT (role_id, permission) DO NOTHING;

-- Sales
INSERT INTO public.role_permissions (role_id, permission)
SELECT id, unnest(ARRAY['clients.create', 'clients.read', 'clients.update', 'clients.change_status_to_closed', 'client_services.read'])
FROM public.roles WHERE name = 'sales'
ON CONFLICT (role_id, permission) DO NOTHING;

-- Ops
INSERT INTO public.role_permissions (role_id, permission)
SELECT id, unnest(ARRAY['clients.read', 'client_services.read', 'client_services.update_stage', 'content.read', 'content.create', 'content.update'])
FROM public.roles WHERE name = 'ops'
ON CONFLICT (role_id, permission) DO NOTHING;

-- Client (for future portal)
INSERT INTO public.role_permissions (role_id, permission)
SELECT id, unnest(ARRAY['content.read', 'reports.read'])
FROM public.roles WHERE name = 'client'
ON CONFLICT (role_id, permission) DO NOTHING;
