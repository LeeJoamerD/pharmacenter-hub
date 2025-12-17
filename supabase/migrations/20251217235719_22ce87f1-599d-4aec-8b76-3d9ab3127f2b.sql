-- Corriger le rôle par défaut dans create_personnel_for_user
-- Utiliser 'Invité' par défaut (l'Admin/Pharmacien Titulaire assignera le rôle réel)
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
    is_active
  ) VALUES (
    create_personnel_for_user.pharmacy_id,
    current_user_id,
    data->>'noms',
    data->>'prenoms',
    ref_agent,
    data->>'email',
    data->>'telephone',
    COALESCE(data->>'role', 'Invité'),  -- Rôle par défaut: Invité
    true
  ) RETURNING id INTO new_personnel_id;

  RETURN jsonb_build_object('success', true, 'personnel_id', new_personnel_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;