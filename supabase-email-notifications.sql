-- Envía un email a joelnogao625@gmail.com cada vez que alguien registra
-- o cambia su voto. Se ejecuta desde la propia base de datos (un trigger
-- de Postgres) usando la API de Resend (https://resend.com), que tiene
-- plan gratuito y no requiere servidor propio.
--
-- PASOS:
-- 1. Crea una cuenta gratuita en https://resend.com (usa
--    joelnogao625@gmail.com como email de la cuenta: mientras no verifiques
--    un dominio propio, Resend SOLO entrega correos a esa dirección).
-- 2. En Resend, ve a "API Keys" y crea una clave. Cópiala.
-- 3. Más abajo, sustituye 're_ZHRrqtZ6_CfzvSYgDW5fzmiK3X3zD444E' por esa clave (déjala entre
--    las comillas simples tal cual).
-- 4. Ejecuta TODO este archivo en Supabase > SQL Editor > New query > Run.
--
-- Para cambiar la clave más adelante, edita la línea de abajo y vuelve a
-- ejecutar solo este archivo (el "create or replace function" sustituye la
-- versión anterior sin duplicar nada).

create extension if not exists pg_net with schema extensions;

create or replace function notify_vote_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  -- <<< Sustituye el texto de abajo por tu clave real de Resend >>>
  api_key text := 're_ZHRrqtZ6_CfzvSYgDW5fzmiK3X3zD444E';
  action_label text;
  subject_line text;
  html_body text;
begin
  if api_key is null or api_key = '' or api_key = 're_ZHRrqtZ6_CfzvSYgDW5fzmiK3X3zD444E' then
    -- No hay clave configurada todavía: no bloquea el voto, simplemente
    -- no manda el correo.
    return new;
  end if;

  action_label := case when tg_op = 'INSERT' then 'Nuevo voto' else 'Voto actualizado' end;
  subject_line := action_label || ' en Pulso Ciudadano: ' || coalesce(new.candidate, '');

  html_body :=
    '<h2>' || action_label || '</h2>' ||
    '<p><strong>Nombre:</strong> ' || coalesce(new.name, '') || '</p>' ||
    '<p><strong>Email:</strong> ' || coalesce(new.email, '') || '</p>' ||
    '<p><strong>Región:</strong> ' || coalesce(new.region, '') || '</p>' ||
    '<p><strong>Opción votada:</strong> ' || coalesce(new.candidate, '') || '</p>';

  perform net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || api_key,
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'from', 'Pulso Ciudadano <onboarding@resend.dev>',
      'to', jsonb_build_array('joelnogao625@gmail.com'),
      'subject', subject_line,
      'html', html_body
    )
  );

  return new;
end;
$$;

drop trigger if exists trg_notify_vote_email on votes;
create trigger trg_notify_vote_email
  after insert or update on votes
  for each row
  execute function notify_vote_email();
