-- Ejecuta esto en Supabase > SQL Editor > New query > Run

create table if not exists candidates (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  sort_order int default 0,
  color text
);

insert into candidates (label, sort_order) values
  ('Lista A', 1),
  ('Lista B', 2),
  ('Lista C', 3),
  ('Lista D', 4),
  ('Voto en blanco / Indeciso', 99)
on conflict (label) do nothing;

create table if not exists votes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  region text not null,
  candidate text not null,
  created_at timestamptz default now()
);

alter table candidates enable row level security;
alter table votes enable row level security;

GRANT SELECT ON public.candidates TO anon, authenticated;
GRANT ALL ON public.candidates, public.votes TO service_role;
CREATE POLICY "public read candidates" ON public.candidates FOR SELECT TO anon, authenticated USING (true);
-- Do not grant raw vote access. Apply security-hardening.sql next for safe RPC operations.
REVOKE ALL ON public.votes FROM anon, authenticated;
