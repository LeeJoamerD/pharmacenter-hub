-- 1) Add Google linkage columns to personnel
ALTER TABLE public.personnel
ADD COLUMN IF NOT EXISTS google_verified boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS google_user_id text,
ADD COLUMN IF NOT EXISTS google_phone text;

-- 2) Function to check if an email is Google-verified for a tenant
CREATE OR REPLACE FUNCTION public.check_google_verified(tenant_id uuid, email text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec RECORD;
BEGIN
  SELECT id, COALESCE(google_verified, false) AS google_verified
  INTO rec
  FROM public.personnel
  WHERE tenant_id = check_google_verified.tenant_id
    AND lower(email) = lower(check_google_verified.email)
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('found', false, 'google_verified', false);
  END IF;

  RETURN jsonb_build_object('found', true, 'google_verified', rec.google_verified, 'personnel_id', rec.id);
END;
$$;

-- 3) Function to check if current auth user already has a personnel record in a tenant
CREATE OR REPLACE FUNCTION public.find_personnel_for_current_user(tenant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec RECORD;
BEGIN
  SELECT id
  INTO rec
  FROM public.personnel
  WHERE tenant_id = find_personnel_for_current_user.tenant_id
    AND auth_user_id = auth.uid()
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('exists', false);
  END IF;

  RETURN jsonb_build_object('exists', true, 'personnel_id', rec.id);
END;
$$;

-- 4) Function to create a personnel record for the current auth user (default role Employé)
CREATE OR REPLACE FUNCTION public.create_personnel_for_user(pharmacy_id uuid, data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  new_personnel_id uuid;
  ref_agent text;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Utilisateur non authentifié');
  END IF;

  -- Générer une référence agent simple
  ref_agent := COALESCE(data->>'reference_agent', 'AG-' || EXTRACT(EPOCH FROM NOW())::bigint);

  INSERT INTO public.personnel (
    tenant_id, auth_user_id, noms, prenoms, reference_agent,
    email, telephone_appel, role, is_active,
    google_verified, google_user_id, google_phone
  ) VALUES (
    create_personnel_for_user.pharmacy_id,
    current_user_id,
    data->>'noms',
    data->>'prenoms',
    ref_agent,
    data->>'email',
    data->>'telephone',
    COALESCE(data->>'role', 'Employé'),
    true,
    COALESCE((data->>'google_verified')::boolean, true),
    data->>'google_user_id',
    data->>'google_phone'
  ) RETURNING id INTO new_personnel_id;

  RETURN jsonb_build_object('success', true, 'personnel_id', new_personnel_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;