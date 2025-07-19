
-- Supprimer l'ancienne fonction problématique
DROP FUNCTION IF EXISTS public.create_new_pharmacy_registration(jsonb, jsonb, text, text);

-- Fonction pour créer uniquement une pharmacie pour un utilisateur authentifié
CREATE OR REPLACE FUNCTION public.create_pharmacy_for_user(pharmacy_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  new_pharmacy_id UUID;
  current_user_id UUID;
  result JSONB;
BEGIN
  -- Récupérer l'utilisateur authentifié
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Utilisateur non authentifié'
    );
  END IF;

  -- Générer un ID pour la nouvelle pharmacie
  new_pharmacy_id := gen_random_uuid();

  -- Créer la pharmacie avec son propre tenant_id
  INSERT INTO public.pharmacies (
    id, tenant_id, name, code, address, quartier, arrondissement, 
    city, region, pays, email, telephone_appel, telephone_whatsapp, 
    departement, type, status
  ) VALUES (
    new_pharmacy_id,
    new_pharmacy_id, -- La pharmacie est son propre tenant
    pharmacy_data->>'name',
    COALESCE(pharmacy_data->>'code', 'PH' || EXTRACT(EPOCH FROM NOW())::bigint),
    pharmacy_data->>'address',
    pharmacy_data->>'quartier',
    pharmacy_data->>'arrondissement',
    pharmacy_data->>'city',
    COALESCE(pharmacy_data->>'region', 'Cameroun'),
    COALESCE(pharmacy_data->>'pays', 'Cameroun'),
    pharmacy_data->>'email',
    pharmacy_data->>'telephone_appel',
    pharmacy_data->>'telephone_whatsapp',
    pharmacy_data->>'departement',
    COALESCE(pharmacy_data->>'type', 'Pharmacie'),
    'active'
  );

  -- Logger la création
  INSERT INTO public.audit_logs (
    tenant_id, user_id, action, table_name,
    record_id, new_values, status
  ) VALUES (
    new_pharmacy_id, current_user_id,
    'PHARMACY_CREATION', 'pharmacies',
    new_pharmacy_id::text,
    pharmacy_data,
    'success'
  );

  -- Retourner le résultat
  result := jsonb_build_object(
    'success', true,
    'pharmacy_id', new_pharmacy_id,
    'message', 'Pharmacie créée avec succès'
  );

  RETURN result;

EXCEPTION WHEN OTHERS THEN
  -- Retourner l'erreur sans insérer dans audit_logs (pas de tenant_id disponible)
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$function$;

-- Fonction pour lier un utilisateur comme admin d'une pharmacie
CREATE OR REPLACE FUNCTION public.create_admin_personnel(pharmacy_id uuid, admin_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  current_user_id UUID;
  user_email TEXT;
  new_personnel_id UUID;
  result JSONB;
BEGIN
  -- Récupérer l'utilisateur authentifié
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Utilisateur non authentifié'
    );
  END IF;

  -- Récupérer l'email de l'utilisateur depuis auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = current_user_id;

  IF user_email IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Email utilisateur non trouvé'
    );
  END IF;

  -- Vérifier que la pharmacie existe
  IF NOT EXISTS (SELECT 1 FROM public.pharmacies WHERE id = pharmacy_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Pharmacie non trouvée'
    );
  END IF;

  -- Créer le personnel admin
  INSERT INTO public.personnel (
    tenant_id, auth_user_id, noms, prenoms, reference_agent,
    email, telephone_appel, role, is_active
  ) VALUES (
    pharmacy_id,
    current_user_id,
    admin_data->>'noms',
    admin_data->>'prenoms',
    admin_data->>'reference_agent',
    user_email,
    admin_data->>'telephone',
    'Admin',
    true
  ) RETURNING id INTO new_personnel_id;

  -- Logger la création du personnel
  INSERT INTO public.audit_logs (
    tenant_id, user_id, personnel_id, action, table_name,
    record_id, new_values, status
  ) VALUES (
    pharmacy_id, current_user_id, new_personnel_id,
    'ADMIN_PERSONNEL_CREATION', 'personnel',
    new_personnel_id::text,
    admin_data,
    'success'
  );

  -- Retourner le résultat
  result := jsonb_build_object(
    'success', true,
    'personnel_id', new_personnel_id,
    'message', 'Administrateur créé avec succès'
  );

  RETURN result;

EXCEPTION WHEN OTHERS THEN
  -- Logger l'erreur avec le tenant_id de la pharmacie
  INSERT INTO public.audit_logs (
    tenant_id, user_id, action, table_name, 
    new_values, status, error_message
  ) VALUES (
    pharmacy_id, current_user_id,
    'ADMIN_PERSONNEL_CREATION_FAILED', 'personnel',
    admin_data,
    'failed', SQLERRM
  );
  
  -- Retourner l'erreur
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$function$;
