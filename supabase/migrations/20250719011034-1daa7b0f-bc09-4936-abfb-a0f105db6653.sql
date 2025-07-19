-- Ajouter tenant_id à la table pharmacies pour permettre la création sécurisée
-- Chaque pharmacie sera son propre tenant
ALTER TABLE public.pharmacies ADD COLUMN tenant_id UUID;

-- Mettre à jour les pharmacies existantes pour qu'elles soient leur propre tenant
UPDATE public.pharmacies SET tenant_id = id WHERE tenant_id IS NULL;

-- Rendre tenant_id obligatoire maintenant
ALTER TABLE public.pharmacies ALTER COLUMN tenant_id SET NOT NULL;

-- Ajouter une contrainte pour s'assurer que tenant_id = id (pharmacie est son propre tenant)
ALTER TABLE public.pharmacies ADD CONSTRAINT pharmacies_tenant_id_equals_id CHECK (tenant_id = id);

-- Créer une fonction spéciale pour l'inscription de pharmacie qui contourne les RLS
CREATE OR REPLACE FUNCTION public.create_new_pharmacy_registration(
  pharmacy_data jsonb,
  admin_data jsonb,
  admin_email text,
  admin_password text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_pharmacy_id UUID;
  new_user_id UUID;
  new_personnel_id UUID;
  result JSONB;
BEGIN
  -- Générer un ID pour la nouvelle pharmacie
  new_pharmacy_id := gen_random_uuid();

  -- 1. Créer la pharmacie avec son propre tenant_id
  INSERT INTO public.pharmacies (
    id, tenant_id, name, code, address, quartier, arrondissement, 
    city, region, pays, email, telephone_appel, telephone_whatsapp, 
    departement, type, status
  ) VALUES (
    new_pharmacy_id,
    new_pharmacy_id, -- La pharmacie est son propre tenant
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
  );

  -- 2. Créer l'utilisateur dans auth.users
  INSERT INTO auth.users (
    id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) VALUES (
    gen_random_uuid(),
    admin_email,
    crypt(admin_password, gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    jsonb_build_object('role', 'Admin', 'tenant_id', new_pharmacy_id),
    NOW(),
    NOW()
  ) RETURNING id INTO new_user_id;

  -- 3. Créer le personnel admin
  INSERT INTO public.personnel (
    tenant_id, auth_user_id, noms, prenoms, reference_agent,
    email, telephone_appel, role, is_active
  ) VALUES (
    new_pharmacy_id,
    new_user_id,
    admin_data->>'noms',
    admin_data->>'prenoms',
    admin_data->>'reference_agent',
    admin_email,
    admin_data->>'telephone',
    'Admin',
    true
  ) RETURNING id INTO new_personnel_id;

  -- 4. Logger l'inscription
  INSERT INTO public.audit_logs (
    tenant_id, user_id, personnel_id, action, table_name,
    record_id, new_values, status
  ) VALUES (
    new_pharmacy_id, new_user_id, new_personnel_id,
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
    'user_id', new_user_id,
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
$$;