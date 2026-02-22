# Marketing Platform (GBP-Agent)

All-in-one marketing platform for local businesses: GBP optimization, content calendar, website, with RBAC (sales, ops, admin, client).

## Stack

- **Next.js 15** (App Router, TypeScript, Tailwind)
- **Supabase** (Auth, Postgres + RLS, Realtime, Storage)

## Setup

### 1. Supabase project

1. Create a project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. Copy **Project URL** and **anon public** key from Settings → API.

### 2. Env

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and set:

- `NEXT_PUBLIC_SUPABASE_URL` = your project URL  
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your anon key  
- `SUPABASE_SERVICE_ROLE_KEY` = your service role key (for admin user list/invite; optional for Phase 3)  

### 3. Database migrations

Run the SQL migrations in your Supabase project (SQL Editor or Supabase CLI):

1. **Order:** Run files in `supabase/migrations/` in order by filename:
   - `20250221000001_roles_profiles_user_roles.sql`
   - `20250221000002_seed_roles_permissions.sql`
   - `20250221000003_custom_access_token_hook.sql`
   - `20250221000004_clients_services.sql` (Phase 2: clients, services, stages)
   - `20250221000005_seed_services_stages.sql` (Phase 2: service catalog)
   - `20250221000006_rls_ops.sql` (Phase 3: RLS for ops, assignment)

2. **Enable the Custom Access Token Hook**  
   In Dashboard: **Authentication** → **Hooks** → **Customize Access Token**  
   - Hook type: **Postgres function**  
   - Function: `public.custom_access_token_hook`

### 4. First admin user

1. In Supabase Dashboard: **Authentication** → **Users** → **Add user** (or sign up via your app).
2. Copy the new user’s UUID.
3. In SQL Editor, assign the admin role (replace `USER_UUID`):

```sql
INSERT INTO public.user_roles (user_id, role_id)
SELECT 'USER_UUID'::uuid, id FROM public.roles WHERE name = 'admin'
ON CONFLICT (user_id, role_id) DO NOTHING;
```

### 5. App

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Log in with your admin user; you should see the dashboard and role-based nav (Dashboard, Clients, Settings, Users).

## Project layout

- `src/app/` – Next.js App Router (login, dashboard, clients, settings, users)
- `src/lib/` – Supabase client/server, middleware, auth helpers
- `src/types/` – Auth types and permission helpers
- `supabase/migrations/` – Postgres migrations (roles, profiles, RLS, hook, seed)

## Roadmap

- **Phase 1 (done):** Foundation, Auth, RBAC, app shell  
- **Phase 2 (done):** Clients, services, sales flow (list, create, edit, detail, add/remove services, close deal, pipeline dashboard)  
- **Phase 3 (done):** Ops assignment, My clients, stage management (move stage), admin users (list, invite, assign role)  
- **Phase 4:** Client portal, content calendar  
- **Phase 5:** GBP integration, reporting  

See the plan in `.cursor/plans/` for full system design and roadmap.
