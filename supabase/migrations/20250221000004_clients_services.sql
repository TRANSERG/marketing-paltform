-- Enums for client and service lifecycle
CREATE TYPE public.client_status AS ENUM (
  'lead', 'qualified', 'closed', 'active', 'churned'
);
CREATE TYPE public.service_status AS ENUM (
  'pending', 'onboarding', 'active', 'paused', 'completed'
);

-- Clients: local businesses (customers)
CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_email text,
  contact_phone text,
  address text,
  timezone text DEFAULT 'UTC',
  status public.client_status NOT NULL DEFAULT 'lead',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_ops_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sold_at timestamptz,
  activated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Service catalog
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Pipeline stages per service (e.g. Brief -> Audit -> Optimization for GBP)
CREATE TABLE public.service_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (service_id, name)
);

-- Which services a client has bought
CREATE TABLE public.client_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  status public.service_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, service_id)
);

-- Current stage per client_service (one row per client_service; update in place when stage changes)
CREATE TABLE public.client_service_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_service_id uuid NOT NULL REFERENCES public.client_services(id) ON DELETE CASCADE,
  service_stage_id uuid NOT NULL REFERENCES public.service_stages(id) ON DELETE CASCADE,
  entered_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  UNIQUE (client_service_id)
);

CREATE INDEX idx_clients_status ON public.clients(status);
CREATE INDEX idx_clients_created_by ON public.clients(created_by);
CREATE INDEX idx_clients_assigned_ops_id ON public.clients(assigned_ops_id);
CREATE INDEX idx_service_stages_service_id ON public.service_stages(service_id);
CREATE INDEX idx_client_services_client_id ON public.client_services(client_id);
CREATE INDEX idx_client_service_stages_client_service_id ON public.client_service_stages(client_service_id);

-- RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_service_stages ENABLE ROW LEVEL SECURITY;

-- clients: SELECT for anyone with clients.read or users.manage
CREATE POLICY "clients_select"
  ON public.clients FOR SELECT TO authenticated
  USING (
    public.has_permission('clients.read') OR public.has_permission('users.manage')
  );

-- clients: INSERT with clients.create; created_by set in app
CREATE POLICY "clients_insert"
  ON public.clients FOR INSERT TO authenticated
  WITH CHECK (public.has_permission('clients.create'));

-- clients: UPDATE for clients.update or users.manage
CREATE POLICY "clients_update"
  ON public.clients FOR UPDATE TO authenticated
  USING (
    public.has_permission('clients.update') OR public.has_permission('users.manage')
  )
  WITH CHECK (
    public.has_permission('clients.update') OR public.has_permission('users.manage')
  );

-- clients: DELETE only admin
CREATE POLICY "clients_delete"
  ON public.clients FOR DELETE TO authenticated
  USING (public.has_permission('users.manage'));

-- services: read for all authenticated; write for admin
CREATE POLICY "services_select"
  ON public.services FOR SELECT TO authenticated USING (true);
CREATE POLICY "services_insert"
  ON public.services FOR INSERT TO authenticated
  WITH CHECK (public.has_permission('users.manage'));
CREATE POLICY "services_update"
  ON public.services FOR UPDATE TO authenticated
  USING (public.has_permission('users.manage'))
  WITH CHECK (public.has_permission('users.manage'));
CREATE POLICY "services_delete"
  ON public.services FOR DELETE TO authenticated
  USING (public.has_permission('users.manage'));

-- service_stages: same as services
CREATE POLICY "service_stages_select"
  ON public.service_stages FOR SELECT TO authenticated USING (true);
CREATE POLICY "service_stages_insert"
  ON public.service_stages FOR INSERT TO authenticated
  WITH CHECK (public.has_permission('users.manage'));
CREATE POLICY "service_stages_update"
  ON public.service_stages FOR UPDATE TO authenticated
  USING (public.has_permission('users.manage'))
  WITH CHECK (public.has_permission('users.manage'));
CREATE POLICY "service_stages_delete"
  ON public.service_stages FOR DELETE TO authenticated
  USING (public.has_permission('users.manage'));

-- client_services: SELECT if user can see clients
CREATE POLICY "client_services_select"
  ON public.client_services FOR SELECT TO authenticated
  USING (
    public.has_permission('clients.read') OR public.has_permission('users.manage')
  );

CREATE POLICY "client_services_insert"
  ON public.client_services FOR INSERT TO authenticated
  WITH CHECK (
    public.has_permission('clients.update') OR public.has_permission('clients.create') OR public.has_permission('users.manage')
  );

CREATE POLICY "client_services_update"
  ON public.client_services FOR UPDATE TO authenticated
  USING (
    public.has_permission('clients.update') OR public.has_permission('users.manage')
  )
  WITH CHECK (
    public.has_permission('clients.update') OR public.has_permission('users.manage')
  );

CREATE POLICY "client_services_delete"
  ON public.client_services FOR DELETE TO authenticated
  USING (
    public.has_permission('clients.update') OR public.has_permission('users.manage')
  );

-- client_service_stages: SELECT same as client_services
CREATE POLICY "client_service_stages_select"
  ON public.client_service_stages FOR SELECT TO authenticated
  USING (
    public.has_permission('clients.read') OR public.has_permission('users.manage')
  );

CREATE POLICY "client_service_stages_insert"
  ON public.client_service_stages FOR INSERT TO authenticated
  WITH CHECK (
    public.has_permission('clients.update') OR public.has_permission('users.manage')
  );

CREATE POLICY "client_service_stages_update"
  ON public.client_service_stages FOR UPDATE TO authenticated
  USING (
    public.has_permission('clients.update') OR public.has_permission('users.manage')
  )
  WITH CHECK (
    public.has_permission('clients.update') OR public.has_permission('users.manage')
  );

CREATE POLICY "client_service_stages_delete"
  ON public.client_service_stages FOR DELETE TO authenticated
  USING (
    public.has_permission('clients.update') OR public.has_permission('users.manage')
  );
