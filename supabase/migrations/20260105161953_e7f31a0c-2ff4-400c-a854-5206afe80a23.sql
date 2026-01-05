-- Corriger la fonction register_pharmacy_with_admin pour correspondre au schéma réel

CREATE OR REPLACE FUNCTION public.register_pharmacy_with_admin(
  pharmacy_data jsonb, 
  admin_data jsonb, 
  admin_email text, 
  admin_password text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pharmacy_id uuid;
  v_personnel_id uuid;
  v_user_id uuid;
  v_reference_agent text;
BEGIN
  -- Vérifier que l'utilisateur est authentifié
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Utilisateur non authentifié');
  END IF;

  -- Valider les données requises
  IF pharmacy_data IS NULL OR admin_data IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Données manquantes');
  END IF;

  -- Générer l'ID de la pharmacie
  v_pharmacy_id := gen_random_uuid();

  -- Créer la pharmacie avec les BONS noms de colonnes
  INSERT INTO public.pharmacies (
    id,
    tenant_id,
    name,
    code,
    address,
    quartier,
    arrondissement,
    city,
    region,
    pays,
    telephone_appel,
    telephone_whatsapp,
    email,
    departement,
    type,
    status
  ) VALUES (
    v_pharmacy_id,
    v_pharmacy_id,
    pharmacy_data->>'name',
    COALESCE(pharmacy_data->>'code', 'PH' || EXTRACT(EPOCH FROM NOW())::bigint),
    pharmacy_data->>'address',
    pharmacy_data->>'quartier',
    pharmacy_data->>'arrondissement',
    pharmacy_data->>'city',
    pharmacy_data->>'region',
    pharmacy_data->>'pays',
    pharmacy_data->>'telephone_appel',
    pharmacy_data->>'telephone_whatsapp',
    pharmacy_data->>'email',
    pharmacy_data->>'departement',
    COALESCE(pharmacy_data->>'type', 'standard'),
    'active'
  );

  -- Générer reference_agent
  v_reference_agent := COALESCE(
    admin_data->>'reference_agent',
    CONCAT(
      SPLIT_PART(COALESCE(admin_data->>'prenoms', ''), ' ', 1),
      '_',
      UPPER(LEFT(SPLIT_PART(COALESCE(admin_data->>'noms', ''), ' ', 1), 4))
    )
  );

  -- Créer le personnel administrateur
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
    v_pharmacy_id,
    v_user_id,
    admin_data->>'noms',
    admin_data->>'prenoms',
    admin_email,
    admin_data->>'telephone',
    'Admin',
    true,
    v_reference_agent
  )
  RETURNING id INTO v_personnel_id;

  -- Log de l'opération
  INSERT INTO public.audit_logs (
    tenant_id,
    action,
    table_name,
    record_id,
    new_values
  ) VALUES (
    v_pharmacy_id,
    'INSERT',
    'pharmacies',
    v_pharmacy_id,
    jsonb_build_object(
      'pharmacy_name', pharmacy_data->>'name',
      'admin_email', admin_email,
      'reference_agent', v_reference_agent
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'pharmacy_id', v_pharmacy_id,
    'personnel_id', v_personnel_id,
    'reference_agent', v_reference_agent,
    'message', 'Pharmacie et administrateur créés avec succès'
  );

EXCEPTION WHEN OTHERS THEN
  INSERT INTO public.audit_logs (
    tenant_id,
    action,
    table_name,
    new_values
  ) VALUES (
    COALESCE(v_pharmacy_id, '00000000-0000-0000-0000-000000000000'::uuid),
    'ERROR',
    'register_pharmacy_with_admin',
    jsonb_build_object('error', SQLERRM, 'detail', SQLSTATE)
  );
  
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;