-- Apply after security-hardening.sql. Back up candidates and votes first.
-- Renames candidaturas (existing votes follow the new names), adds regional
-- candidaturas, and enforces "only votable where it stands" in cast_vote.
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS regions text[];
COMMENT ON COLUMN public.candidates.regions IS 'Comunidades where this candidatura can be voted; NULL = all of Spain.';

-- Rename existing labels (votes store the label text, so update both).
DO $$
DECLARE r record;
BEGIN
 FOR r IN SELECT * FROM (VALUES
  ('SUMAR','Sumar'),('JUNTS','Junts per Catalunya'),('EHB','EH Bildu'),
  ('PNV','EAJ-PNV'),('PODEMOS','Podemos'),('SALF','Se Acabó La Fiesta'),
  ('VOX','Vox')) AS t(old_label,new_label)
 LOOP
  IF EXISTS (SELECT 1 FROM public.candidates WHERE label=r.old_label)
     AND NOT EXISTS (SELECT 1 FROM public.candidates WHERE label=r.new_label) THEN
   UPDATE public.candidates SET label=r.new_label WHERE label=r.old_label;
   UPDATE public.votes SET candidate=r.new_label WHERE candidate=r.old_label;
  END IF;
 END LOOP;
END $$;

INSERT INTO public.candidates(label, sort_order, color) VALUES
 ('PP',1,'#1D84CE'),('PSOE',2,'#E1001A'),('Vox',3,'#63BE21'),('Sumar',4,'#E51C55'),
 ('Podemos',5,'#6B2E68'),('Se Acabó La Fiesta',6,'#7A5C3E'),
 ('ERC',10,'#FFB232'),('Junts per Catalunya',11,'#20C0B2'),
 ('EH Bildu',12,'#00A39A'),('EAJ-PNV',13,'#008135'),('BNG',14,'#76B3DD'),
 ('Coalición Canaria',15,'#FFD700'),('UPN',16,'#2A52BE'),
 ('Voto en blanco / Indeciso',99,'#9A9A8E')
ON CONFLICT (label) DO UPDATE SET sort_order=EXCLUDED.sort_order, color=COALESCE(public.candidates.color, EXCLUDED.color);

UPDATE public.candidates SET regions = CASE label
 WHEN 'ERC' THEN ARRAY['Cataluña']
 WHEN 'Junts per Catalunya' THEN ARRAY['Cataluña']
 WHEN 'EH Bildu' THEN ARRAY['País Vasco','Navarra']
 WHEN 'EAJ-PNV' THEN ARRAY['País Vasco']
 WHEN 'BNG' THEN ARRAY['Galicia']
 WHEN 'Coalición Canaria' THEN ARRAY['Canarias']
 WHEN 'UPN' THEN ARRAY['Navarra']
 ELSE NULL END;

CREATE OR REPLACE FUNCTION public.cast_vote(voter_name text, voter_region text, selected_candidate text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE verified_email text;
BEGIN
 SELECT lower(email) INTO verified_email FROM auth.users WHERE id=auth.uid() AND email_confirmed_at IS NOT NULL;
 IF auth.uid() IS NULL OR verified_email IS NULL THEN RAISE EXCEPTION 'Verified sign-in required' USING ERRCODE='42501'; END IF;
 IF length(trim(voter_name)) NOT BETWEEN 1 AND 100 OR length(trim(voter_region)) NOT BETWEEN 1 AND 100 OR voter_name IS NULL OR voter_region IS NULL THEN RAISE EXCEPTION 'Invalid voter details'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.candidates WHERE label=selected_candidate) THEN RAISE EXCEPTION 'Invalid candidate'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.candidates WHERE label=selected_candidate AND (regions IS NULL OR trim(voter_region) = ANY(regions))) THEN
  RAISE EXCEPTION 'Esta candidatura no se presenta en tu comunidad' USING ERRCODE='22023';
 END IF;
 IF EXISTS (SELECT 1 FROM public.votes WHERE email=verified_email AND user_id IS DISTINCT FROM auth.uid()) THEN
  RAISE EXCEPTION 'Legacy vote requires owner-assisted migration; email alone cannot claim it' USING ERRCODE='42501';
 END IF;
 INSERT INTO public.votes(name,email,region,candidate,user_id)
 VALUES(trim(voter_name),verified_email,trim(voter_region),selected_candidate,auth.uid())
 ON CONFLICT(user_id) WHERE user_id IS NOT NULL DO UPDATE SET name=EXCLUDED.name,region=EXCLUDED.region,candidate=EXCLUDED.candidate;
END; $$;
REVOKE ALL ON FUNCTION public.cast_vote(text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cast_vote(text,text,text) TO authenticated;
