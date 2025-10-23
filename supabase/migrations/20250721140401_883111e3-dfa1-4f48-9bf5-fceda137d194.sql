-- Modifier la fonction register_pharmacy_with_admin pour ne plus créer l'utilisateur dans auth.users
-- car il est déjà créé par l'authentification Google
CREATE OR REPLACE FUNCTION public.register_pharmacy_with_admin(pharmacy_data jsonb, admin_data jsonb, admin_email text, admin_password text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  new_pharmacy_id UUID;
  current_user_id UUID;
  new_personnel_id UUID;
  result JSONB;
BEGIN
  -- Validation des données d'entrée
  IF pharmacy_data IS NULL OR admin_data IS NULL OR admin_email IS NULL THEN
    RAISE EXCEPTION 'Données manquantes pour l''inscription';
  END IF;

  -- Récupérer l'utilisateur authentifié actuel
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non authentifié';
  END IF;

  -- Vérifier que l'email correspond à l'utilisateur authentifié
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = current_user_id AND email = admin_email) THEN
    RAISE EXCEPTION 'L''email ne correspond pas à l''utilisateur authentifié';
  END IF;

  -- 1. Créer la pharmacie (SANS RLS car fonction SECURITY DEFINER)
  INSERT INTO public.pharmacies (
    name, code, address, quartier, arrondissement, city, region, pays, 
    email, telephone_appel, telephone_whatsapp, departement, type, status
  ) VALUES (
    pharmacy_data->>'name',
    pharmacy_data->>'code', 
    pharmacy_data->>'address',
    pharmacy_data->>'quartier',
    pharmacy_data->>'arrondissement',
    pharmacy_data->>'city',
    pharmacy_data->>'region',
    pharmacy_data->>'pays',
    pharmacy_data->>'email',
    pharmacy_data->>'telephone_appel',
    pharmacy_data->>'telephone_whatsapp',
    pharmacy_data->>'departement',
    pharmacy_data->>'type',
    'active'
  ) RETURNING id INTO new_pharmacy_id;

  -- 2. Créer le personnel admin (l'utilisateur existe déjà dans auth.users)
  INSERT INTO public.personnel (
    tenant_id, auth_user_id, noms, prenoms, reference_agent,
    email, telephone_appel, role, is_active
  ) VALUES (
    new_pharmacy_id,
    current_user_id,
    admin_data->>'noms',
    admin_data->>'prenoms', 
    admin_data->>'reference_agent',
    admin_email,
    admin_data->>'telephone',
    'Admin',
    true
  ) RETURNING id INTO new_personnel_id;

  -- 3. Logger l'inscription dans l'audit
  INSERT INTO public.audit_logs (
    tenant_id, user_id, personnel_id, action, table_name, 
    record_id, new_values, status
  ) VALUES (
    new_pharmacy_id, current_user_id, new_personnel_id,
    'PHARMACY_REGISTRATION', 'pharmacies', 
    new_pharmacy_id::text, 
    jsonb_build_object(
      'pharmacy', pharmacy_data,
      'admin', admin_data
    ),
    'success'
  );

  -- Retourner le résultat
  result := jsonb_build_object(
    'success', true,
    'pharmacy_id', new_pharmacy_id,
    'user_id', current_user_id,
    'personnel_id', new_personnel_id,
    'message', 'Pharmacie et administrateur créés avec succès'
  );

  RETURN result;

EXCEPTION WHEN OTHERS THEN
  -- Logger l'erreur
  INSERT INTO public.audit_logs (
    action, table_name, new_values, status, error_message
  ) VALUES (
    'PHARMACY_REGISTRATION_FAILED', 'pharmacies',
    jsonb_build_object('pharmacy', pharmacy_data, 'admin', admin_data),
    'failed', SQLERRM
  );
  
  -- Retourner l'erreur
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$function$;