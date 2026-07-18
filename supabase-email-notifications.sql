-- Envía un email a joelnogao625@gmail.com cada vez que alguien registra
-- o cambia su voto, usando la API de Resend (https://resend.com).
--
-- IMPORTANTE: este archivo NO contiene ninguna clave y es seguro subirlo
-- a GitHub. La clave de Resend se guarda por separado, cifrada, en
-- Supabase Vault, mediante un comando que ejecutas tú a mano en el SQL
-- Editor (ese comando sí contiene la clave, pero nunca se guarda en un
-- archivo ni se sube al repositorio).
--
-- PASOS:
-- 1. Ejecuta TODO este archivo en Supabase > SQL Editor > New query > Run.
-- 2. Luego, en una consulta NUEVA del SQL Editor (no la guardes en ningún
--    archivo del repo), ejecuta solo esto, con tu clave real de Resend:
--
--      select vault.create_secret('re_TU_CLAVE_REAL', 'resend_api_key');
--
--    Si ya la habías guardado antes y quieres cambiarla:
--
--      select vault.update_secret(
--        (select id from vault.secrets where name = 'resend_api_key'),
--        're_TU_CLAVE_NUEVA'
--      );

create extension if not exists pg_net with schema extensions;
create extension if not exists supabase_vault;

create or replace function notify_vote_email()
returns trigger
language plpgsql
security definer
set search_path = public, vault, extensions
as $$
declare
  api_key text;
  action_label text;
  subject_line text;
  html_body text;
begin
  select decrypted_secret into api_key
  from vault.decrypted_secrets
  where name = 'resend_api_key'
  limit 1;

  if api_key is null or api_key = '' then
    -- Todavía no has guardado la clave en Vault (ver instrucciones arriba):
    -- no bloquea el voto, simplemente no manda el correo.
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
