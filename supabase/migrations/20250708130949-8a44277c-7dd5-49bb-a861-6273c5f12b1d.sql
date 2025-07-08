-- Fonction sécurisée pour l'inscription de pharmacie avec administrateur
CREATE OR REPLACE FUNCTION public.register_pharmacy_with_admin(
  pharmacy_data JSONB,
  admin_data JSONB,
  admin_email TEXT,
  admin_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Exécute avec privilèges du propriétaire
AS $$
DECLARE
  new_pharmacy_id UUID;
  new_user_id UUID;
  new_personnel_id UUID;
  result JSONB;
BEGIN
  -- Validation des données d'entrée
  IF pharmacy_data IS NULL OR admin_data IS NULL OR 
     admin_email IS NULL OR admin_password IS NULL THEN
    RAISE EXCEPTION 'Données manquantes pour l''inscription';
  END IF;

  -- Vérifier que l'email n'existe pas déjà
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = admin_email) THEN
    RAISE EXCEPTION 'Cet email est déjà utilisé';
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

  -- 4. Logger l'inscription dans l'audit
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

-- Donner permission d'exécution à tous
GRANT EXECUTE ON FUNCTION public.register_pharmacy_with_admin TO anon, authenticated;

-- Supprimer les anciennes politiques temporaires d'inscription
DROP POLICY IF EXISTS "Allow pharmacy registration" ON public.pharmacies;
DROP POLICY IF EXISTS "Allow admin creation during registration" ON public.personnel;

-- Remettre des politiques RLS normales et sécurisées
CREATE POLICY "Users can view their own pharmacy" 
ON public.pharmacies 
FOR SELECT 
USING (id = get_current_user_tenant_id());

CREATE POLICY "Admins can update their pharmacy" 
ON public.pharmacies 
FOR UPDATE 
USING (
  id = get_current_user_tenant_id() AND
  EXISTS (
    SELECT 1 FROM public.personnel 
    WHERE auth_user_id = auth.uid() 
    AND role = 'Admin'
  )
);

-- Personnel : politiques normales
CREATE POLICY "Users can view personnel from their tenant" 
ON public.personnel 
FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update their own profile" 
ON public.personnel 
FOR UPDATE 
USING (auth_user_id = auth.uid());

CREATE POLICY "Admins can manage personnel in their tenant" 
ON public.personnel 
FOR INSERT
WITH CHECK (
  tenant_id = get_current_user_tenant_id() AND
  EXISTS (
    SELECT 1 FROM public.personnel 
    WHERE auth_user_id = auth.uid() 
    AND role IN ('Admin', 'Pharmacien')
  )
);