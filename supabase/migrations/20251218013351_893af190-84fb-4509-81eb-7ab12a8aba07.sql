-- Supprimer et recréer la fonction create_personnel_for_user sans les colonnes Google
DROP FUNCTION IF EXISTS public.create_personnel_for_user(uuid, jsonb);

CREATE FUNCTION public.create_personnel_for_user(pharmacy_id uuid, data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_user_email text;
  new_personnel_id uuid;
  v_reference_agent text;
  v_noms text;
  v_prenoms text;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Utilisateur non authentifié');
  END IF;

  -- Récupérer l'email de l'utilisateur authentifié
  SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;

  -- Extraire noms et prénoms
  v_noms := COALESCE(data->>'noms', '');
  v_prenoms := COALESCE(data->>'prenoms', '');

  -- Générer reference_agent au format Prénom_NOMS(4 lettres)
  v_reference_agent := COALESCE(
    data->>'reference_agent',
    CONCAT(
      SPLIT_PART(v_prenoms, ' ', 1),
      '_',
      UPPER(LEFT(SPLIT_PART(v_noms, ' ', 1), 4))
    )
  );

  INSERT INTO public.personnel (
    tenant_id,
    auth_user_id,
    noms,
    prenoms,
    email,
    telephone_appel,
    role,
    is_active,
    reference_agent
  ) VALUES (
    create_personnel_for_user.pharmacy_id,
    v_user_id,
    v_noms,
    v_prenoms,
    COALESCE(data->>'email', v_user_email),
    data->>'telephone',
    COALESCE(data->>'role', 'Invité'),
    true,
    v_reference_agent
  ) RETURNING id INTO new_personnel_id;

  RETURN jsonb_build_object('success', true, 'personnel_id', new_personnel_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;