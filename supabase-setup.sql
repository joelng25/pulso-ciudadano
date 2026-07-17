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

-- "to anon" solo cubre visitantes sin sesión. Como ahora también hay gente
-- que entra con Google (rol "authenticated"), usamos "to public" para que
-- las políticas apliquen a cualquier visitante, con o sin sesión.

-- Cualquiera puede leer las listas
create policy "public read candidates" on candidates
  for select to public using (true);

-- Cualquiera puede leer los resultados agregados
create policy "public read votes" on votes
  for select to public using (true);

-- Cualquiera puede registrar su voto (la columna email es UNIQUE,
-- así que la propia base de datos impide el doble voto)
create policy "public insert votes" on votes
  for insert to public with check (true);
