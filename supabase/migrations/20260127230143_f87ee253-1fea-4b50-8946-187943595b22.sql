-- ================================================
-- PHASE 1: Découplage Authentification Pharmacie/Utilisateur
-- ================================================

-- 1.1 Ajouter password_hash à la table pharmacies (si pas déjà fait)
ALTER TABLE public.pharmacies ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- 1.2 Fonction RPC pour authentifier une pharmacie directement
-- Sans passer par auth.users de Supabase
CREATE OR REPLACE FUNCTION public.authenticate_pharmacy(
  p_email TEXT,
  p_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pharmacy RECORD;
  v_session_token TEXT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Vérifier les credentials dans la table pharmacies
  SELECT * INTO v_pharmacy 
  FROM pharmacies 
  WHERE lower(email) = lower(p_email)
  AND password_hash = crypt(p_password, password_hash)
  AND status = 'active';
  
  IF NOT FOUND THEN
    -- Vérifier si l'email existe mais mot de passe incorrect
    IF EXISTS (SELECT 1 FROM pharmacies WHERE lower(email) = lower(p_email)) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Mot de passe incorrect');
    END IF;
    RETURN jsonb_build_object('success', false, 'error', 'Aucune pharmacie trouvée avec cet email');
  END IF;
  
  -- Créer une session pharmacie
  v_session_token := encode(gen_random_bytes(32), 'hex');
  v_expires_at := NOW() + INTERVAL '7 days';
  
  -- Désactiver les anciennes sessions
  UPDATE pharmacy_sessions 
  SET is_active = false 
  WHERE pharmacy_id = v_pharmacy.id AND is_active = true;
  
  -- Créer la nouvelle session
  INSERT INTO pharmacy_sessions (pharmacy_id, session_token, expires_at, is_active)
  VALUES (v_pharmacy.id, v_session_token, v_expires_at, true);
  
  -- Retourner les données sans le password_hash
  RETURN jsonb_build_object(
    'success', true,
    'pharmacy', jsonb_build_object(
      'id', v_pharmacy.id,
      'name', v_pharmacy.name,
      'email', v_pharmacy.email,
      'code', v_pharmacy.code,
      'address', v_pharmacy.address,
      'city', v_pharmacy.city,
      'quartier', v_pharmacy.quartier,
      'arrondissement', v_pharmacy.arrondissement,
      'departement', v_pharmacy.departement,
      'region', v_pharmacy.region,
      'pays', v_pharmacy.pays,
      'type', v_pharmacy.type,
      'status', v_pharmacy.status,
      'telephone_appel', v_pharmacy.telephone_appel,
      'telephone_whatsapp', v_pharmacy.telephone_whatsapp,
      'logo', v_pharmacy.logo,
      'created_at', v_pharmacy.created_at,
      'updated_at', v_pharmacy.updated_at
    ),
    'session_token', v_session_token,
    'expires_at', v_expires_at
  );
END;
$$;

-- 1.3 Fonction RPC pour vérifier si un email est disponible pour un utilisateur
-- (non utilisé par une pharmacie)
CREATE OR REPLACE FUNCTION public.check_email_available_for_user(p_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM pharmacies WHERE lower(email) = lower(p_email)) THEN
    RETURN jsonb_build_object('available', false, 'reason', 'email_used_by_pharmacy');
  END IF;
  RETURN jsonb_build_object('available', true);
END;
$$;

-- 1.4 Fonction pour créer une pharmacie SANS créer d'utilisateur auth
-- Elle crée UNIQUEMENT la pharmacie avec son password_hash
CREATE OR REPLACE FUNCTION public.register_pharmacy_simple(
  pharmacy_data JSONB,
  pharmacy_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pharmacy_id UUID;
  v_session_token TEXT;
  v_expires_at TIMESTAMPTZ;
  v_password_hash TEXT;
BEGIN
  -- Vérifier que l'email n'existe pas déjà
  IF EXISTS (SELECT 1 FROM pharmacies WHERE lower(email) = lower(pharmacy_data->>'email')) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Une pharmacie avec cet email existe déjà');
  END IF;
  
  -- Générer le hash du mot de passe avec pgcrypto
  v_password_hash := crypt(pharmacy_password, gen_salt('bf'));
  
  -- Créer la pharmacie avec le password_hash
  INSERT INTO pharmacies (
    name,
    code,
    address,
    quartier,
    arrondissement,
    city,
    departement,
    region,
    pays,
    telephone_appel,
    telephone_whatsapp,
    email,
    type,
    status,
    password_hash
  )
  VALUES (
    pharmacy_data->>'name',
    COALESCE(pharmacy_data->>'code', 'PH' || extract(epoch from now())::text),
    pharmacy_data->>'address',
    pharmacy_data->>'quartier',
    pharmacy_data->>'arrondissement',
    pharmacy_data->>'city',
    pharmacy_data->>'departement',
    COALESCE(pharmacy_data->>'region', 'République du Congo'),
    COALESCE(pharmacy_data->>'pays', 'République du Congo'),
    pharmacy_data->>'telephone_appel',
    pharmacy_data->>'telephone_whatsapp',
    pharmacy_data->>'email',
    COALESCE(pharmacy_data->>'type', 'standard'),
    'active',
    v_password_hash
  )
  RETURNING id INTO v_pharmacy_id;
  
  -- Créer une session pharmacie immédiatement
  v_session_token := encode(gen_random_bytes(32), 'hex');
  v_expires_at := NOW() + INTERVAL '7 days';
  
  INSERT INTO pharmacy_sessions (pharmacy_id, session_token, expires_at, is_active)
  VALUES (v_pharmacy_id, v_session_token, v_expires_at, true);
  
  -- Retourner le succès avec les données de session
  RETURN jsonb_build_object(
    'success', true,
    'pharmacy_id', v_pharmacy_id,
    'session_token', v_session_token,
    'expires_at', v_expires_at
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 1.5 Fonction pour mettre à jour le mot de passe d'une pharmacie
CREATE OR REPLACE FUNCTION public.update_pharmacy_password(
  p_pharmacy_id UUID,
  p_new_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_password_hash TEXT;
BEGIN
  -- Générer le nouveau hash
  v_password_hash := crypt(p_new_password, gen_salt('bf'));
  
  -- Mettre à jour le mot de passe
  UPDATE pharmacies 
  SET password_hash = v_password_hash, updated_at = NOW()
  WHERE id = p_pharmacy_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Pharmacie non trouvée');
  END IF;
  
  RETURN jsonb_build_object('success', true);
END;
$$;

-- 1.6 Vue sécurisée pour les pharmacies (sans password_hash)
DROP VIEW IF EXISTS public.pharmacies_public;
CREATE VIEW public.pharmacies_public AS
SELECT 
  id, code, name, address, city, region, departement, arrondissement,
  quartier, postal_code, pays, telephone_appel, telephone_whatsapp,
  email, logo, photo_exterieur, photo_interieur, status, type,
  created_at, updated_at, tenant_id, niu
FROM public.pharmacies;

-- Accorder les droits sur la vue
GRANT SELECT ON public.pharmacies_public TO authenticated;
GRANT SELECT ON public.pharmacies_public TO anon;