-- Catálogo provincial para el desglose del sondeo.
-- Ejecutar después de supabase-setup.sql y antes de security-hardening.sql.
CREATE TABLE IF NOT EXISTS public.provinces (
  name text PRIMARY KEY,
  region text NOT NULL
);

INSERT INTO public.provinces (name, region) VALUES
  ('Almería','Andalucía'),('Cádiz','Andalucía'),('Córdoba','Andalucía'),('Granada','Andalucía'),('Huelva','Andalucía'),('Jaén','Andalucía'),('Málaga','Andalucía'),('Sevilla','Andalucía'),
  ('Huesca','Aragón'),('Teruel','Aragón'),('Zaragoza','Aragón'),
  ('Asturias','Asturias'),('Illes Balears','Islas Baleares'),
  ('Las Palmas','Canarias'),('Santa Cruz de Tenerife','Canarias'),('Cantabria','Cantabria'),
  ('Albacete','Castilla-La Mancha'),('Ciudad Real','Castilla-La Mancha'),('Cuenca','Castilla-La Mancha'),('Guadalajara','Castilla-La Mancha'),('Toledo','Castilla-La Mancha'),
  ('Ávila','Castilla y León'),('Burgos','Castilla y León'),('León','Castilla y León'),('Palencia','Castilla y León'),('Salamanca','Castilla y León'),('Segovia','Castilla y León'),('Soria','Castilla y León'),('Valladolid','Castilla y León'),('Zamora','Castilla y León'),
  ('Barcelona','Cataluña'),('Girona','Cataluña'),('Lleida','Cataluña'),('Tarragona','Cataluña'),
  ('Badajoz','Extremadura'),('Cáceres','Extremadura'),
  ('A Coruña','Galicia'),('Lugo','Galicia'),('Ourense','Galicia'),('Pontevedra','Galicia'),
  ('La Rioja','La Rioja'),('Madrid','Comunidad de Madrid'),('Murcia','Región de Murcia'),('Navarra','Navarra'),
  ('Álava','País Vasco'),('Bizkaia','País Vasco'),('Gipuzkoa','País Vasco'),
  ('Alicante','Comunidad Valenciana'),('Castellón','Comunidad Valenciana'),('Valencia','Comunidad Valenciana'),
  ('Ceuta','Ceuta'),('Melilla','Melilla')
ON CONFLICT (name) DO UPDATE SET region = EXCLUDED.region;

ALTER TABLE public.provinces ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.provinces TO anon, authenticated;
DROP POLICY IF EXISTS "public read provinces" ON public.provinces;
CREATE POLICY "public read provinces" ON public.provinces FOR SELECT TO anon, authenticated USING (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'votes_province_region_fk'
  ) THEN
    ALTER TABLE public.votes
      ADD CONSTRAINT votes_province_region_fk
      FOREIGN KEY (province) REFERENCES public.provinces(name);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS votes_province_idx ON public.votes(province);
