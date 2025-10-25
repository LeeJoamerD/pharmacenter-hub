-- Migration corrective : Corriger les noms de colonnes dans register_pharmacy_with_admin

-- Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS public.register_pharmacy_with_admin(JSONB, JSONB, TEXT, TEXT);

-- Recréer la fonction avec les BONS noms de colonnes
CREATE OR REPLACE FUNCTION public.register_pharmacy_with_admin(
  pharmacy_data JSONB,
  admin_data JSONB,
  admin_email TEXT,
  admin_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_pharmacy_id UUID;
  current_user_id UUID;
  new_personnel_id UUID;
  result JSONB;
BEGIN
  -- Validation des données
  IF pharmacy_data IS NULL OR admin_data IS NULL OR admin_email IS NULL THEN
    RAISE EXCEPTION 'Données manquantes pour l''inscription';
  END IF;

  -- Récupérer l'utilisateur authentifié
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non authentifié';
  END IF;

  -- Vérifier que l'email correspond
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = current_user_id AND email = admin_email) THEN
    RAISE EXCEPTION 'L''email ne correspond pas à l''utilisateur authentifié';
  END IF;

  -- Générer l'ID pour la nouvelle pharmacie
  new_pharmacy_id := gen_random_uuid();

  -- 1. Créer la pharmacie avec tenant_id = id et les BONS noms de colonnes
  INSERT INTO public.pharmacies (
    id, tenant_id, name, code, address, 
    city, region, pays, email, telephone_appel, 
    telephone_whatsapp, quartier, arrondissement,
    departement, type, status, created_at, updated_at
  ) VALUES (
    new_pharmacy_id,
    new_pharmacy_id,
    pharmacy_data->>'name',
    COALESCE(pharmacy_data->>'licence_number', 'PH-' || substr(new_pharmacy_id::text, 1, 8)),
    pharmacy_data->>'address',
    pharmacy_data->>'city',
    pharmacy_data->>'region',
    COALESCE(pharmacy_data->>'pays', 'République du Congo'),
    pharmacy_data->>'email',
    pharmacy_data->>'telephone_appel',
    pharmacy_data->>'telephone_whatsapp',
    pharmacy_data->>'quartier',
    pharmacy_data->>'arrondissement',
    pharmacy_data->>'departement',
    COALESCE(pharmacy_data->>'type', 'Pharmacie'),
    'active',
    now(),
    now()
  );

  -- 2. Créer le personnel admin
  INSERT INTO public.personnel (
    tenant_id, auth_user_id, noms, prenoms, reference_agent,
    email, telephone_appel, telephone_whatsapp, role, is_active,
    created_at, updated_at
  ) VALUES (
    new_pharmacy_id,
    current_user_id,
    admin_data->>'noms',
    admin_data->>'prenoms',
    COALESCE(admin_data->>'reference', 'ADM-' || substr(current_user_id::text, 1, 8)),
    admin_email,
    admin_data->>'telephone_principal',
    admin_data->>'whatsapp',
    COALESCE(admin_data->>'role', 'Admin'),
    true,
    now(),
    now()
  ) RETURNING id INTO new_personnel_id;

  -- 3. Logger dans audit_logs
  INSERT INTO public.audit_logs (
    tenant_id, user_id, personnel_id, action, table_name, 
    record_id, new_values, created_at
  ) VALUES (
    new_pharmacy_id, 
    current_user_id, 
    new_personnel_id,
    'PHARMACY_REGISTRATION', 
    'pharmacies', 
    new_pharmacy_id,
    jsonb_build_object(
      'pharmacy', pharmacy_data, 
      'admin', admin_data
    ),
    now()
  );

  -- Retourner succès
  RETURN jsonb_build_object(
    'success', true,
    'pharmacy_id', new_pharmacy_id,
    'user_id', current_user_id,
    'personnel_id', new_personnel_id,
    'message', 'Pharmacie et administrateur créés avec succès'
  );

EXCEPTION WHEN OTHERS THEN
  -- Logger l'erreur seulement si new_pharmacy_id existe (pour éviter FK violation)
  IF new_pharmacy_id IS NOT NULL THEN
    INSERT INTO public.audit_logs (
      tenant_id, user_id, action, table_name, new_values, created_at
    ) VALUES (
      new_pharmacy_id,
      current_user_id,
      'PHARMACY_REGISTRATION_FAILED', 
      'pharmacies',
      jsonb_build_object(
        'pharmacy', pharmacy_data, 
        'admin', admin_data,
        'error', SQLERRM
      ),
      now()
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', false, 
    'error', SQLERRM
  );
END;
$$;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION public.register_pharmacy_with_admin(JSONB, JSONB, TEXT, TEXT) 
TO anon, authenticated;