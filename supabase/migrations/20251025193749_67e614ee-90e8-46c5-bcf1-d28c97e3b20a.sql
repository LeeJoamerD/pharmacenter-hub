-- Supprimer la contrainte FK qui bloque les insertions système
ALTER TABLE public.audit_logs 
DROP CONSTRAINT IF EXISTS audit_logs_tenant_id_fkey;

-- Rendre tenant_id NULLABLE pour permettre les logs système sans tenant
ALTER TABLE public.audit_logs 
ALTER COLUMN tenant_id DROP NOT NULL;

-- Recréer la fonction register_pharmacy_with_admin avec gestion correcte
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

  -- Générer l'ID pour la nouvelle pharmacie
  new_pharmacy_id := gen_random_uuid();

  -- 1. Créer la pharmacie avec tenant_id = id (auto-référence)
  INSERT INTO public.pharmacies (
    id, tenant_id, name, code, address, quartier, arrondissement, 
    city, region, pays, email, telephone_appel, telephone_whatsapp, 
    departement, type, status, created_at, updated_at
  ) VALUES (
    new_pharmacy_id,
    new_pharmacy_id, -- La pharmacie est son propre tenant
    pharmacy_data->>'name',
    pharmacy_data->>'code', 
    pharmacy_data->>'address',
    pharmacy_data->>'quartier',
    pharmacy_data->>'arrondissement',
    pharmacy_data->>'city',
    COALESCE(pharmacy_data->>'region', 'République du Congo'),
    COALESCE(pharmacy_data->>'pays', 'République du Congo'),
    pharmacy_data->>'email',
    pharmacy_data->>'telephone_appel',
    pharmacy_data->>'telephone_whatsapp',
    pharmacy_data->>'departement',
    pharmacy_data->>'type',
    'active',
    now(),
    now()
  );

  -- 2. Créer le personnel admin
  INSERT INTO public.personnel (
    tenant_id, auth_user_id, noms, prenoms, reference_agent,
    email, telephone_appel, role, is_active, created_at, updated_at
  ) VALUES (
    new_pharmacy_id,
    current_user_id,
    admin_data->>'noms',
    admin_data->>'prenoms', 
    admin_data->>'reference_agent',
    admin_email,
    admin_data->>'telephone',
    'Admin',
    true,
    now(),
    now()
  ) RETURNING id INTO new_personnel_id;

  -- 3. Logger l'inscription dans l'audit (maintenant sans contrainte FK)
  INSERT INTO public.audit_logs (
    tenant_id, user_id, personnel_id, action, table_name, 
    record_id, new_values, status, created_at
  ) VALUES (
    new_pharmacy_id, 
    current_user_id, 
    new_personnel_id,
    'PHARMACY_REGISTRATION', 
    'pharmacies', 
    new_pharmacy_id::text, 
    jsonb_build_object(
      'pharmacy', pharmacy_data,
      'admin', admin_data
    ),
    'success',
    now()
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
  -- Logger l'erreur (maintenant possible sans contrainte FK)
  INSERT INTO public.audit_logs (
    tenant_id, user_id, action, table_name, 
    new_values, status, error_message, created_at
  ) VALUES (
    COALESCE(new_pharmacy_id, gen_random_uuid()),
    current_user_id,
    'PHARMACY_REGISTRATION_FAILED', 
    'pharmacies',
    jsonb_build_object('pharmacy', pharmacy_data, 'admin', admin_data),
    'failed', 
    SQLERRM,
    now()
  );
  
  -- Retourner l'erreur
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$function$;

-- Politique d'insertion système pour audit_logs
DROP POLICY IF EXISTS "System insert audit" ON public.audit_logs;
CREATE POLICY "System insert audit" 
ON public.audit_logs
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Politique de lecture limitée au tenant
DROP POLICY IF EXISTS "View audit from tenant" ON public.audit_logs;
CREATE POLICY "View audit from tenant"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (tenant_id = get_current_user_tenant_id() OR tenant_id IS NULL);