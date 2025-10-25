-- Update resolve_oauth_personnel_link to always set google_verified=true for linked users
CREATE OR REPLACE FUNCTION public.resolve_oauth_personnel_link()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid;
  user_email text;
  rec record;
  updated boolean := false;
BEGIN
  uid := auth.uid();
  IF uid IS NULL THEN
    RETURN jsonb_build_object('status','no_session');
  END IF;

  -- Retrieve authenticated user's email from auth.users
  SELECT email INTO user_email FROM auth.users WHERE id = uid;
  IF user_email IS NULL THEN
    RETURN jsonb_build_object('status','no_email');
  END IF;

  -- Case 1: Personnel already linked to this auth user
  SELECT id, tenant_id, is_active, COALESCE(google_verified, false) AS google_verified
  INTO rec
  FROM public.personnel
  WHERE auth_user_id = uid
  ORDER BY created_at DESC
  LIMIT 1;

  IF FOUND THEN
    -- Ensure google_verified is set to true after OAuth
    IF rec.google_verified IS DISTINCT FROM true THEN
      UPDATE public.personnel
      SET google_verified = true,
          updated_at = now()
      WHERE id = rec.id;
      updated := true;
    END IF;

    RETURN jsonb_build_object(
      'status', CASE WHEN rec.is_active THEN 'active' ELSE 'inactive_linked' END,
      'personnel_id', rec.id,
      'tenant_id', rec.tenant_id,
      'google_verified_updated', updated
    );
  END IF;

  -- Case 2: Personnel exists by email but not yet linked to auth user
  SELECT id, tenant_id, is_active
  INTO rec
  FROM public.personnel
  WHERE lower(email) = lower(user_email)
    AND auth_user_id IS NULL
  ORDER BY created_at DESC
  LIMIT 1;

  IF FOUND THEN
    -- Link account and activate, mark Google verified
    UPDATE public.personnel
    SET auth_user_id = uid,
        google_verified = true,
        updated_at = now(),
        is_active = true
    WHERE id = rec.id;

    RETURN jsonb_build_object(
      'status','linked_and_activated',
      'personnel_id', rec.id,
      'tenant_id', rec.tenant_id
    );
  END IF;

  -- Case 3: No personnel for this email -> new user flow
  RETURN jsonb_build_object(
    'status','new_user',
    'email', user_email
  );
END;
$function$;

-- New helper to explicitly mark google_verified=true for the current user's personnel
CREATE OR REPLACE FUNCTION public.mark_personnel_google_verified(p_tenant_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid;
  rec record;
  changed boolean := false;
BEGIN
  uid := auth.uid();
  IF uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Utilisateur non authentifié');
  END IF;

  -- Find the personnel row for current user, optionally scoped to a tenant
  SELECT id, tenant_id, COALESCE(google_verified, false) AS google_verified
  INTO rec
  FROM public.personnel
  WHERE auth_user_id = uid
    AND (p_tenant_id IS NULL OR tenant_id = p_tenant_id)
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Aucun personnel lié pour cet utilisateur');
  END IF;

  IF rec.google_verified IS DISTINCT FROM true THEN
    UPDATE public.personnel
    SET google_verified = true,
        updated_at = now()
    WHERE id = rec.id;
    changed := true;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'personnel_id', rec.id,
    'tenant_id', rec.tenant_id,
    'changed', changed
  );
END;
$function$;