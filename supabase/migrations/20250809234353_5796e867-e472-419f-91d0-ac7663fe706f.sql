-- Create a function to resolve Google OAuth outcomes and link/activate personnel when appropriate
CREATE OR REPLACE FUNCTION public.resolve_oauth_personnel_link()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  uid uuid;
  user_email text;
  rec record;
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
  SELECT id, tenant_id, is_active
  INTO rec
  FROM public.personnel
  WHERE auth_user_id = uid
  ORDER BY created_at DESC
  LIMIT 1;

  IF FOUND THEN
    IF rec.is_active THEN
      RETURN jsonb_build_object(
        'status','active',
        'personnel_id', rec.id,
        'tenant_id', rec.tenant_id
      );
    ELSE
      RETURN jsonb_build_object(
        'status','inactive_linked',
        'personnel_id', rec.id,
        'tenant_id', rec.tenant_id
      );
    END IF;
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
    -- Link account and activate per requested behavior
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
$$;