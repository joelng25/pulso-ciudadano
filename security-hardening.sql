-- Apply to the Pulso database only, after backup and before deploying the matching frontend.
-- Existing votes are retained. Legacy rows remain unowned and cannot be claimed by email.
ALTER TABLE public.votes ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE UNIQUE INDEX IF NOT EXISTS votes_user_id_unique ON public.votes(user_id) WHERE user_id IS NOT NULL;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public read votes" ON public.votes;
DROP POLICY IF EXISTS "public insert votes" ON public.votes;
DROP POLICY IF EXISTS "public update votes" ON public.votes;
REVOKE ALL ON public.votes FROM anon, authenticated;
GRANT ALL ON public.votes TO service_role;

CREATE OR REPLACE FUNCTION public.my_vote() RETURNS TABLE(candidate text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS (SELECT 1 FROM auth.users WHERE id=auth.uid() AND email_confirmed_at IS NOT NULL) THEN
  RAISE EXCEPTION 'Verified sign-in required' USING ERRCODE='42501';
 END IF;
 RETURN QUERY SELECT v.candidate FROM public.votes v WHERE v.user_id=auth.uid();
END; $$;
REVOKE ALL ON FUNCTION public.my_vote() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_vote() TO authenticated;

CREATE OR REPLACE FUNCTION public.cast_vote(voter_name text, voter_region text, selected_candidate text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE verified_email text;
BEGIN
 SELECT lower(email) INTO verified_email FROM auth.users WHERE id=auth.uid() AND email_confirmed_at IS NOT NULL;
 IF auth.uid() IS NULL OR verified_email IS NULL THEN RAISE EXCEPTION 'Verified sign-in required' USING ERRCODE='42501'; END IF;
 IF length(trim(voter_name)) NOT BETWEEN 1 AND 100 OR length(trim(voter_region)) NOT BETWEEN 1 AND 100 OR voter_name IS NULL OR voter_region IS NULL THEN RAISE EXCEPTION 'Invalid voter details'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.candidates WHERE label=selected_candidate) THEN RAISE EXCEPTION 'Invalid candidate'; END IF;
 IF EXISTS (SELECT 1 FROM public.votes WHERE email=verified_email AND user_id IS DISTINCT FROM auth.uid()) THEN
  RAISE EXCEPTION 'Legacy vote requires owner-assisted migration; email alone cannot claim it' USING ERRCODE='42501';
 END IF;
 INSERT INTO public.votes(name,email,region,candidate,user_id)
 VALUES(trim(voter_name),verified_email,trim(voter_region),selected_candidate,auth.uid())
 ON CONFLICT(user_id) WHERE user_id IS NOT NULL DO UPDATE SET name=EXCLUDED.name,region=EXCLUDED.region,candidate=EXCLUDED.candidate;
END; $$;
REVOKE ALL ON FUNCTION public.cast_vote(text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cast_vote(text,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.vote_results() RETURNS TABLE(region text,candidate text,vote_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT v.region,v.candidate,count(*) FROM public.votes v GROUP BY v.region,v.candidate;
$$;
REVOKE ALL ON FUNCTION public.vote_results() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.vote_results() TO anon, authenticated;
COMMENT ON COLUMN public.votes.user_id IS 'Verified authentication account ownership. Legacy NULL rows must not be auto-claimed from a client-supplied email.';
