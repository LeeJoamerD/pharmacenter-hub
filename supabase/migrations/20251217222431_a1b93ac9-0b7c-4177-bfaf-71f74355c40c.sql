-- Fonction pour créer un enregistrement personnel pour l'utilisateur authentifié actuel
-- Utilisée lors de l'inscription d'un nouvel utilisateur dans une pharmacie existante
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
  -- Vérifier l'authentification
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Utilisateur non authentifié');
  END IF;

  -- Générer une référence agent si non fournie
  ref_agent := COALESCE(data->>'reference_agent', 'AG-' || EXTRACT(EPOCH FROM NOW())::bigint);

  -- Créer l'enregistrement personnel
  INSERT INTO public.personnel (
    tenant_id, 
    auth_user_id, 
    noms, 
    prenoms, 
    reference_agent,
    email, 
    telephone_appel, 
    role, 
    is_active,
    google_verified, 
    google_user_id, 
    google_phone
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

-- Autoriser l'exécution par les utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION public.create_personnel_for_user(uuid, jsonb) TO authenticated;