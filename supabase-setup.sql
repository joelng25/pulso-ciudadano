-- Ejecuta esto en Supabase > SQL Editor > New query > Run

create table if not exists candidates (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  sort_order int default 0
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

-- Cualquier visitante (clave "anon") puede leer las listas
create policy "public read candidates" on candidates
  for select to anon using (true);

-- Cualquier visitante puede leer los resultados agregados
create policy "public read votes" on votes
  for select to anon using (true);

-- Cualquier visitante puede registrar su voto (la columna email es UNIQUE,
-- así que la propia base de datos impide el doble voto)
create policy "public insert votes" on votes
  for insert to anon with check (true);
