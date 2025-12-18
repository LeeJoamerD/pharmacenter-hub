-- =====================================================
-- UNIFICATION : Référence Agent + Client Auto
-- Pour : register_pharmacy_with_admin, create_personnel_for_user
-- =====================================================

-- 1. Mettre à jour la fonction register_pharmacy_with_admin
CREATE OR REPLACE FUNCTION public.register_pharmacy_with_admin(
  pharmacy_data jsonb,
  admin_data jsonb,
  admin_email text,
  admin_password text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'auth'
AS $function$
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

  -- Créer la pharmacie (tenant_id = id de la pharmacie)
  INSERT INTO public.pharmacies (
    id,
    tenant_id,
    nom,
    adresse,
    telephone,
    email,
    numero_agrement,
    forme_juridique,
    capital_social,
    rccm,
    niu,
    regime_fiscal,
    responsable_nom,
    responsable_telephone,
    statut
  ) VALUES (
    gen_random_uuid(),
    gen_random_uuid(),
    pharmacy_data->>'nom',
    pharmacy_data->>'adresse',
    pharmacy_data->>'telephone',
    pharmacy_data->>'email',
    pharmacy_data->>'numero_agrement',
    pharmacy_data->>'forme_juridique',
    (pharmacy_data->>'capital_social')::numeric,
    pharmacy_data->>'rccm',
    pharmacy_data->>'niu',
    pharmacy_data->>'regime_fiscal',
    pharmacy_data->>'responsable_nom',
    pharmacy_data->>'responsable_telephone',
    'active'
  )
  RETURNING id INTO v_pharmacy_id;

  -- Mettre à jour tenant_id = id de la pharmacie
  UPDATE public.pharmacies SET tenant_id = v_pharmacy_id WHERE id = v_pharmacy_id;

  -- Générer reference_agent au format unifié : Premier_Prénom_NOMS(4 lettres)
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
    fonction,
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
    COALESCE(admin_data->>'fonction', 'Pharmacien Titulaire'),
    COALESCE(admin_data->>'role', 'Pharmacien Titulaire'),
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
      'pharmacy_name', pharmacy_data->>'nom',
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
  -- Log l'erreur
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
$function$;

-- 2. Mettre à jour la fonction create_personnel_for_user
CREATE OR REPLACE FUNCTION public.create_personnel_for_user(
  pharmacy_id uuid,
  data jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'auth'
AS $function$
DECLARE
  v_user_id uuid;
  v_user_email text;
  v_personnel_id uuid;
  v_reference_agent text;
  v_noms text;
  v_prenoms text;
BEGIN
  -- Récupérer l'utilisateur authentifié
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Utilisateur non authentifié');
  END IF;

  -- Récupérer l'email de l'utilisateur
  SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;

  -- Récupérer noms et prénoms
  v_noms := COALESCE(data->>'noms', '');
  v_prenoms := COALESCE(data->>'prenoms', '');

  -- Générer reference_agent au format unifié : Premier_Prénom_NOMS(4 lettres)
  v_reference_agent := COALESCE(
    data->>'reference_agent',
    CONCAT(
      SPLIT_PART(v_prenoms, ' ', 1),
      '_',
      UPPER(LEFT(SPLIT_PART(v_noms, ' ', 1), 4))
    )
  );

  -- Créer le personnel
  INSERT INTO public.personnel (
    tenant_id,
    auth_user_id,
    noms,
    prenoms,
    email,
    telephone_appel,
    role,
    is_active,
    reference_agent,
    google_verified,
    google_phone
  ) VALUES (
    pharmacy_id,
    v_user_id,
    v_noms,
    v_prenoms,
    COALESCE(data->>'email', v_user_email),
    data->>'telephone',
    COALESCE(data->>'role', 'Invité'),
    true,
    v_reference_agent,
    COALESCE((data->>'google_verified')::boolean, false),
    data->>'google_phone'
  )
  RETURNING id INTO v_personnel_id;

  RETURN jsonb_build_object(
    'success', true,
    'personnel_id', v_personnel_id,
    'reference_agent', v_reference_agent,
    'message', 'Personnel créé avec succès'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;

-- 3. Modifier le trigger pour créer un client pour TOUS les personnels (sans condition auth_user_id)
CREATE OR REPLACE FUNCTION public.create_client_for_personnel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Créer un client pour TOUS les personnels (plus de condition sur auth_user_id)
  INSERT INTO clients (
    tenant_id,
    type_client,
    personnel_id,
    nom_complet,
    telephone,
    adresse,
    taux_remise_automatique
  ) VALUES (
    NEW.tenant_id,
    'Personnel'::type_client,
    NEW.id,
    CONCAT(NEW.prenoms, ' ', NEW.noms),
    NEW.telephone_appel,
    NEW.adresse,
    0.00
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Erreur lors de la création du client pour le personnel %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$function$;

-- 4. Créer les clients manquants pour les personnels existants
INSERT INTO public.clients (
  tenant_id,
  type_client,
  personnel_id,
  nom_complet,
  telephone,
  adresse,
  taux_remise_automatique
)
SELECT 
  p.tenant_id,
  'Personnel'::type_client,
  p.id,
  CONCAT(p.prenoms, ' ', p.noms),
  p.telephone_appel,
  p.adresse,
  0.00
FROM public.personnel p
WHERE NOT EXISTS (
  SELECT 1 FROM public.clients c WHERE c.personnel_id = p.id
)
AND p.tenant_id IS NOT NULL;