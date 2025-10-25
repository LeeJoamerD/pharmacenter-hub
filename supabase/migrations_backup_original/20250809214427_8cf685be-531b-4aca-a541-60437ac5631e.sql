-- Fix ambiguous column references by qualifying columns with table aliases

-- 1) check_google_verified
CREATE OR REPLACE FUNCTION public.check_google_verified(
  tenant_id uuid,
  email text
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  rec RECORD;
BEGIN
  SELECT p.id, COALESCE(p.google_verified, false) AS google_verified
  INTO rec
  FROM public.personnel AS p
  WHERE p.tenant_id = check_google_verified.tenant_id
    AND lower(p.email) = lower(check_google_verified.email)
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('found', false, 'google_verified', false);
  END IF;

  RETURN jsonb_build_object(
    'found', true,
    'google_verified', rec.google_verified,
    'personnel_id', rec.id
  );
END;
$$;

-- 2) find_personnel_for_current_user
CREATE OR REPLACE FUNCTION public.find_personnel_for_current_user(
  tenant_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  rec RECORD;
BEGIN
  SELECT p.id
  INTO rec
  FROM public.personnel AS p
  WHERE p.tenant_id = find_personnel_for_current_user.tenant_id
    AND p.auth_user_id = auth.uid()
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('exists', false);
  END IF;

  RETURN jsonb_build_object('exists', true, 'personnel_id', rec.id);
END;
$$;
