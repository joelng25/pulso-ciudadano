-- Renombra Sumar a Frente Amplio y le da un color propio. Los votos existentes pasan al nuevo nombre.
-- Ejecutar una vez (después de la copia de seguridad). Se puede repetir sin efectos.
BEGIN;
ALTER TABLE public.votes DISABLE TRIGGER USER; -- sin correos por la actualización
UPDATE public.candidates SET label = 'Frente Amplio', color = '#B5179E' WHERE label = 'Sumar';
UPDATE public.candidates SET color = '#B5179E' WHERE label = 'Frente Amplio';
UPDATE public.votes SET candidate = 'Frente Amplio' WHERE candidate = 'Sumar';
ALTER TABLE public.votes ENABLE TRIGGER USER;
COMMIT;
